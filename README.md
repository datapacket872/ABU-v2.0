ABU Interactive Package
========================

What this package contains:
- A copy of the original front-end (templates/) with a progressive enhancement layer.
- A minimal Flask backend (app.py) demonstrating:
  * password hashing (werkzeug.security)
  * CSRF token issuance and verification (session-backed)
  * Basic API endpoints: /api/login, /api/products, /api/cart
  * Simple in-memory product store for demonstration

How to run (development):
1. Create a Python virtualenv and install dependencies:
   python -m venv venv
   source venv/bin/activate
   pip install flask werkzeug

2. Run:
   python app.py

Security notes / recommended production changes:
- Move secret key to an environment variable and do NOT hardcode.
- Use HTTPS and set cookies with Secure and HttpOnly flags.
- Use a proper database with prepared statements and parameterized queries.
- Implement rate limiting (e.g. nginx, flask-limiter) and account lockouts for failed logins.
- Use server-side session store (Redis) or signed cookies with short TTL.
- Implement CSP, SRI for external assets, and input validation on both client and server.
- Replace demo in-memory USERS with real user table and email verification.

