"""
Safaricom M-Pesa Daraja API integration (STK Push / Lipa Na M-Pesa Online).

Flow:
  1. get_access_token()      -> OAuth token from Daraja
  2. initiate_stk_push()     -> sends the push prompt to the customer's phone,
                                 creates a PENDING Payment record
  3. handle_callback()       -> Safaricom posts the result here; this is the
                                 ONLY place a payment is ever marked SUCCESS.

IMPORTANT: a successfully *submitted* STK push only means the prompt reached
the phone. It does NOT mean the customer paid. Never mark an order paid until
handle_callback() processes ResultCode == 0.
"""
import base64
import logging
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)

BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


def _base_url():
    return BASE_URLS.get(settings.MPESA_ENVIRONMENT, BASE_URLS["sandbox"])


class DarajaError(Exception):
    """Daraja refused or could not service the STK push request."""


# Daraja bearer tokens are valid for ~60 minutes. Caching avoids an extra
# OAuth round-trip on every single request, which matters because the
# STK Query endpoint is aggressively rate limited.
_token_cache = {"token": None, "expires_at": None}
TOKEN_TTL_SECONDS = 50 * 60


def get_access_token(force_refresh=False):
    now = datetime.now()
    if (
        not force_refresh
        and _token_cache["token"]
        and _token_cache["expires_at"]
        and now < _token_cache["expires_at"]
    ):
        return _token_cache["token"]

    token = _request_access_token()
    _token_cache["token"] = token
    _token_cache["expires_at"] = now + timedelta(seconds=TOKEN_TTL_SECONDS)
    return token


def _request_access_token():
    missing = [
        name
        for name, value in (
            ("MPESA_CONSUMER_KEY", settings.MPESA_CONSUMER_KEY),
            ("MPESA_CONSUMER_SECRET", settings.MPESA_CONSUMER_SECRET),
        )
        if not value
    ]
    if missing:
        raise DarajaError(
            f"{' and '.join(missing)} is not set in backend/.env. "
            "Get these from the Daraja portal (Apps & Keys) before testing payments."
        )

    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    try:
        response = requests.get(
            url,
            auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=30,
        )
    except requests.RequestException as exc:
        raise DarajaError(f"Could not reach Daraja at {_base_url()}: {exc}") from exc

    if response.status_code != 200:
        raise DarajaError(
            f"Daraja rejected the consumer credentials (HTTP {response.status_code}). "
            "Check MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET and that you are "
            f"using the {'sandbox' if settings.MPESA_ENVIRONMENT == 'sandbox' else 'production'} "
            "keys for this environment."
        )

    try:
        return response.json()["access_token"]
    except (ValueError, KeyError) as exc:
        raise DarajaError(
            f"Daraja returned an unexpected OAuth response (HTTP {response.status_code}): "
            f"{response.text[:200]}"
        ) from exc


def generate_timestamp():
    return datetime.now().strftime("%Y%m%d%H%M%S")


def generate_password(timestamp):
    raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def normalize_phone(phone_number):
    phone_number = phone_number.strip().replace(" ", "")
    if phone_number.startswith("0"):
        return "254" + phone_number[1:]
    if phone_number.startswith("+254"):
        return phone_number[1:]
    return phone_number


def initiate_stk_push(order, phone_number):
    from .models import Payment

    # The request Password is base64(shortcode + passkey + timestamp). Daraja
    # rejects a wrong passkey with the unhelpful "Wrong credentials", so catch an
    # obviously-bad one here. Daraja passkeys are 32 characters.
    if not settings.MPESA_PASSKEY:
        raise DarajaError(
            "MPESA_PASSKEY is not set in backend/.env. Copy the passkey from the "
            "Daraja portal (Paybill > Manage Paybill > Get Passkey)."
        )
    if len(settings.MPESA_PASSKEY) < 16:
        raise DarajaError(
            f"MPESA_PASSKEY looks wrong: it is {len(settings.MPESA_PASSKEY)} "
            "characters but Daraja passkeys are 32. Copy the full passkey from the "
            "Daraja portal (Paybill > Manage Paybill > Get Passkey)."
        )

    phone = normalize_phone(phone_number)
    timestamp = generate_timestamp()
    password = generate_password(timestamp)
    access_token = get_access_token()

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(order.total),
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": order.order_number,
        "TransactionDesc": f"Payment for order {order.order_number}",
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    try:
        data = response.json()
    except ValueError as exc:
        raise DarajaError(
            f"Daraja returned a non-JSON response (HTTP {response.status_code}). "
            "Check MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET and MPESA_ENVIRONMENT."
        ) from exc

    # Daraja returns two different shapes: an accepted/queued push uses
    # ResponseCode/ResponseDescription, while a hard rejection uses
    # errorCode/errorMessage (often with HTTP 500). Read both.
    response_code = str(data.get("ResponseCode", data.get("errorCode", "")))
    description = data.get("ResponseDescription") or data.get("errorMessage") or ""
    accepted = data.get("ResponseCode") == "0"

    payment = Payment.objects.create(
        order=order,
        phone_number=phone,
        amount=order.total,
        merchant_request_id=data.get("MerchantRequestID", ""),
        checkout_request_id=data.get("CheckoutRequestID", ""),
        status="PENDING",
        result_description=description,
    )

    if not accepted:
        # Daraja refused the request outright (bad credentials/passkey, unactivated
        # paybill, invalid MSISDN...). No prompt reached the phone, so there will
        # never be a callback - don't leave the payment stuck on PENDING.
        if not description:
            description = f"Daraja rejected the request (code {response_code or 'unknown'})"
        logger.warning("STK push submission failed for order %s: %s", order.order_number, data)
        payment.status = "FAILED"
        payment.result_code = response_code
        payment.result_description = description
        payment.save(update_fields=["status", "result_code", "result_description"])
        raise DarajaError(description)

    return payment, data


@transaction.atomic
def handle_callback(callback_body):
    """
    Idempotently process the Daraja callback payload. Safe to call more than
    once with the same CheckoutRequestID - it will not double-process.
    """
    from orders.services import deduct_stock_for_order
    from .models import Payment

    stk_callback = callback_body.get("Body", {}).get("stkCallback", {})
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")
    result_desc = stk_callback.get("ResultDesc", "")

    if not checkout_request_id:
        logger.error("M-Pesa callback missing CheckoutRequestID: %s", callback_body)
        return None

    try:
        payment = Payment.objects.select_for_update().get(checkout_request_id=checkout_request_id)
    except Payment.DoesNotExist:
        logger.error("No matching Payment for CheckoutRequestID %s", checkout_request_id)
        return None

    # Idempotency guard: if we've already resolved this payment, do nothing further.
    if payment.status in ("SUCCESS", "FAILED", "CANCELLED"):
        return payment

    payment.raw_callback = callback_body
    payment.result_code = str(result_code)
    payment.result_description = result_desc

    if result_code == 0:
        metadata_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        meta = {item.get("Name"): item.get("Value") for item in metadata_items}
        payment.mpesa_receipt_number = meta.get("MpesaReceiptNumber", "")
        payment.transaction_date = str(meta.get("TransactionDate", ""))
        payment.amount_paid = _coerce_amount(meta.get("Amount"), payment.amount)
        payment.status = "SUCCESS"
        payment.save()

        order = payment.order
        order.payment_status = "SUCCESS"
        order.order_status = "CONFIRMED"
        order.save(update_fields=["payment_status", "order_status"])
        deduct_stock_for_order(order)
    else:
        # Common Daraja result codes: 1032 = cancelled by user, 1 = insufficient funds, 1037 = timeout
        payment.status = "CANCELLED" if result_code == 1032 else "FAILED"
        payment.save()

        order = payment.order
        order.payment_status = payment.status
        order.save(update_fields=["payment_status"])

    return payment


def _coerce_amount(value, fallback):
    """Daraja sends Amount as a string, int, or float depending on the endpoint."""
    try:
        if value in (None, ""):
            return fallback
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return fallback


# Result codes that mean "terminal - will never change again".
TERMINAL_FAILURES = {
    1: "Insufficient funds",
    1032: "Request cancelled by user",
    1037: "No response from user",
    1038: "Request timeout due to low battery",
    1039: "Request timeout due to network error",
    1043: "No need to prompt user",
}


def query_stk_status(checkout_request_id):
    """Ask Daraja the authoritative outcome of an STK push.

    Needed when the callback can't be delivered (no public callback URL, network
    fault, server downtime). Daraja rate-limits this hard (spike arrest: ~3
    requests per burst, 30 per minute), so callers must throttle.
    """
    timestamp = generate_timestamp()
    password = generate_password(timestamp)
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "CheckoutRequestID": checkout_request_id,
        "Password": password,
        "Timestamp": timestamp,
    }
    headers = {"Authorization": f"Bearer {get_access_token()}"}
    url = f"{_base_url()}/mpesa/stkpushquery/v1/query"

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as exc:
        logger.warning("STK query request failed for %s: %s", checkout_request_id, exc)
        return None

    if response.status_code == 429:
        # Spike arrest. Not a payment failure - just try again later.
        logger.info("STK query rate limited for %s", checkout_request_id)
        return None
    if response.status_code in (401, 403):
        # Safaricom's WAF challenges rapid bursts with an HTML bot page.
        logger.warning(
            "STK query blocked (HTTP %s) for %s - backing off",
            response.status_code, checkout_request_id,
        )
        if response.status_code == 401:
            # Bearer may have expired mid-flight; force a fresh one next time.
            _token_cache["token"] = None
            _token_cache["expires_at"] = None
        return None
    if response.status_code != 200:
        logger.warning(
            "STK query HTTP %s for %s: %s",
            response.status_code, checkout_request_id, response.text[:200],
        )
        return None

    try:
        data = response.json()
    except ValueError:
        logger.warning("STK query returned non-JSON for %s", checkout_request_id)
        return None

    if str(data.get("ResponseCode")) != "0":
        logger.info(
            "STK query rejected for %s: %s",
            checkout_request_id, data.get("ResponseDescription"),
        )
        return None

    raw_code = data.get("ResultCode")
    try:
        result_code = int(raw_code)
    except (TypeError, ValueError):
        result_code = None

    return {
        "result_code": result_code,
        "result_desc": data.get("ResultDesc", ""),
        "amount": data.get("Amount"),
        "raw": data,
    }


def reconcile_payment(payment):
    """Bring a single PENDING payment up to date using the STK Query API.

    Returns the payment, or None if Daraja couldn't be reached / is rate limiting.
    """
    if not payment.checkout_request_id or payment.status != "PENDING":
        return payment

    try:
        result = query_stk_status(payment.checkout_request_id)
    except DarajaError:
        # Auth/WAF problems are temporary and must never abort the sweep.
        logger.warning("STK query could not be issued for %s", payment.checkout_request_id)
        return None
    except requests.RequestException as exc:
        logger.warning("STK query network failure for %s: %s", payment.checkout_request_id, exc)
        return None

    if result is None:
        return None

    code = result["result_code"]
    if code is None:
        logger.warning(
            "STK query returned an unreadable ResultCode for %s: %s",
            payment.checkout_request_id, result["raw"],
        )
        return payment

    # Save the query timestamp so the throttle can rate-limit subsequent polls.
    payment.result_code = str(code)
    payment.result_description = result["result_desc"]
    payment.save(update_fields=["result_code", "result_description", "updated_at"])

    if code == 0:
        payment.amount_paid = _coerce_amount(result["amount"], payment.amount)
        payment.status = "SUCCESS"
        payment.save(update_fields=["status", "amount_paid"])

        order = payment.order
        order.payment_status = "SUCCESS"
        order.order_status = "CONFIRMED"
        order.save(update_fields=["payment_status", "order_status"])
        from orders.services import deduct_stock_for_order

        deduct_stock_for_order(order)
        logger.info("Reconciled %s as SUCCESS via STK query", payment.checkout_request_id)
    elif code in TERMINAL_FAILURES:
        payment.status = "CANCELLED" if code == 1032 else "FAILED"
        payment.save(update_fields=["status"])

        order = payment.order
        order.payment_status = payment.status
        order.save(update_fields=["payment_status"])
        logger.info(
            "Reconciled %s as %s via STK query", payment.checkout_request_id, payment.status
        )
    # Non-terminal codes (still pending at Safaricom) are left as PENDING.
    return payment
