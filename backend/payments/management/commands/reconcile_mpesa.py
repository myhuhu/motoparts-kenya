"""Sweep PENDING M-Pesa payments and reconcile them against Daraja.

Use when the callback URL is unreachable (or a callback was missed) and you want
to find out which pushes actually succeeded.

    python manage.py reconcile_mpesa              # sweep, 20s between queries
    python manage.py reconcile_mpesa --all        # ignore the age threshold
    python manage.py reconcile_mpesa --payment 19 # one specific payment
"""
import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from payments.models import Payment

# Daraja spike arrest: ~3 requests per burst, 30 per minute. Stay well under it.
DEFAULT_DELAY = 20


class Command(BaseCommand):
    help = "Reconcile PENDING M-Pesa payments against the Daraja STK Query API."

    def add_arguments(self, parser):
        parser.add_argument("--payment", type=int, help="Reconcile one payment by id.")
        parser.add_argument("--all", action="store_true", help="Include very young payments.")
        parser.add_argument(
            "--delay", type=int, default=DEFAULT_DELAY, help="Seconds between queries."
        )
        parser.add_argument(
            "--limit", type=int, default=50, help="Maximum payments to query."
        )

    def handle(self, *args, **options):
        from payments.mpesa import reconcile_payment

        if options["payment"]:
            qs = Payment.objects.filter(pk=options["payment"])
        else:
            qs = Payment.objects.filter(status="PENDING").exclude(
                checkout_request_id__isnull=True
            )
            if not options["all"]:
                cutoff = timezone.now() - timedelta(seconds=10)
                qs = qs.filter(created_at__lte=cutoff)
            qs = qs.order_by("-id")[: options["limit"]]

        payments = list(qs)
        self.stdout.write(f"Reconciling {len(payments)} PENDING payment(s)...\n")
        if not payments:
            self.stdout.write("Nothing to reconcile.")
            return

        counts = {"SUCCESS": 0, "FAILED": 0, "CANCELLED": 0, "PENDING": 0, "SKIPPED": 0}

        for i, payment in enumerate(payments):
            before = payment.status
            result = reconcile_payment(payment)
            if result is None:
                counts["SKIPPED"] += 1
                note = "skipped (rate limited / unreachable)"
            else:
                counts[result.status] = counts.get(result.status, 0) + 1
                note = result.status
                if result.status == before == "PENDING":
                    note = "still pending at Safaricom"

            self.stdout.write(
                f"  [{i + 1}/{len(payments)}] payment {payment.id} "
                f"amount={payment.amount} -> {note} ({result.result_code if result else '-'} "
                f"{result.result_description if result else ''})"
            )
            if i < len(payments) - 1:
                time.sleep(options["delay"])

        self.stdout.write("")
        for status_name, count in counts.items():
            if count:
                self.stdout.write(f"  {status_name}: {count}")
