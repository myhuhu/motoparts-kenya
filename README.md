# MotoParts Kenya — Motorcycle & Electric Bike Spare Parts Marketplace

A full-stack e-commerce platform: **Django REST Framework** backend + **React (Vite)** frontend,
with **M-Pesa Daraja STK Push** checkout.

```
motoparts-kenya/
├── backend/   Django REST API (MySQL, JWT auth, M-Pesa)
└── frontend/  React + Vite + Tailwind CSS
```

## 1. Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill in your real values
```

Create the MySQL database first:

```sql
CREATE DATABASE motoparts_db CHARACTER SET utf8mb4;
```

> No MySQL handy? Set `USE_SQLITE=True` in `.env` to run instantly on SQLite for local development/testing.

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_products      # loads sample categories & products
python manage.py runserver          # http://127.0.0.1:8000
```

Django Admin: http://127.0.0.1:8000/admin/

### M-Pesa (Daraja) sandbox setup
1. Create an app at https://developer.safaricom.co.ke and get your Consumer Key/Secret.
2. Use the shared sandbox shortcode `174379` and the sandbox passkey from the Daraja docs.
3. For the callback URL, expose your local server with a tunnel (e.g. `ngrok http 8000`) and set
   `MPESA_CALLBACK_URL=https://<your-ngrok-domain>/api/payments/mpesa/callback/` in `.env`.
4. Leave `MPESA_ENVIRONMENT=sandbox` until you're ready to go live with a paybill/till.

**Payment safety note:** an order is only ever marked `SUCCESS` after Safaricom's callback is
received and processed in `payments/mpesa.py::handle_callback()` — never on STK push submission
alone. Callback processing is idempotent (guarded by `CheckoutRequestID`) so a duplicate callback
can't double-deduct stock or double-create a payment record.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000` (see `vite.config.js`),
so make sure the Django server is running on port 8000.

## 3. Key API endpoints

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/auth/me/

GET    /api/products/               ?search=&brand=&motorcycle_brand=&category=&min_price=&max_price=&ordering=
GET    /api/products/<slug>/
GET    /api/products/featured/
GET    /api/categories/

GET    /api/cart/                   POST /api/cart/   PUT/DELETE /api/cart/<id>/

POST   /api/orders/create/          GET /api/orders/   GET /api/orders/<id>/

POST   /api/payments/mpesa/stk/
POST   /api/payments/mpesa/callback/   (Safaricom → Django, public)

GET    /api/reviews/?product=<id>   POST /api/reviews/
GET    /api/wishlist/               POST /api/wishlist/   DELETE /api/wishlist/<id>/
```

## 4. Security notes
- Prices and order totals are **always recalculated server-side** from the database
  (`orders/services.py::create_order_from_cart`) — the frontend total is never trusted.
- Stock is deducted inside a `transaction.atomic()` block and guarded against negative stock.
- JWT auth (SimpleJWT) protects all account, cart, order and payment endpoints.

## 5. Production deployment
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```
Set `DEBUG=False`, a real `SECRET_KEY`, proper `ALLOWED_HOSTS`, and serve `frontend/dist` (after
`npm run build`) via Nginx or any static host, proxying `/api` and `/media` to Gunicorn.
