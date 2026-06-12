# Varma Hardware E-Commerce

Full-stack hardware enterprise store scaffold with React, Node.js, MongoDB, Razorpay payments, OTP, email, and an admin dashboard.

## Frontend

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Routes are managed in `client/src/routes/AppRoutes.jsx`.

Frontend env variables must start with `VITE_`. The app currently uses:

- `VITE_API_URL`
- `VITE_APP_NAME`
- `VITE_RAZORPAY_KEY_ID`

Main routes:

- `/` storefront home
- `/shop` product listing
- `/products/:slug` product details
- `/cart` cart
- `/checkout` delivery and payment screen
- `/admin/dashboard` admin dashboard
- `/admin/products` admin product management
- `/admin/orders` admin orders

## Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Update `server/.env` with MongoDB, `JWT_SECRET`, Razorpay, and SMTP credentials. On deployment platforms, set these in the service environment, not in a committed file. Use a long random value for `JWT_SECRET`. The mail service supports either `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` or the common aliases `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.

For Gmail, use an app password, keep `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, and set `MAIL_FROM` to the same Gmail account or a verified alias. Check `/api/health/mail/verify` after deploying to confirm SMTP login.

API modules:

- `/api/auth` register, login, current user
- `/api/products` product catalog and admin product CRUD
- `/api/orders` customer orders and admin fulfillment
- `/api/payments` Razorpay order creation and verification
- `/api/otp` send and verify OTP

## Notes

- The SMS service logs OTPs to the console until Twilio credentials are configured.
- The mail service skips real email until SMTP credentials are configured.
- Razorpay requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
