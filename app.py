from flask import Flask, request, jsonify, send_from_directory, make_response, session
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import time

app = Flask(__name__, static_folder='static', template_folder='templates')
# In production, set a strong, environment-driven secret key
app.secret_key = secrets.token_hex(32)

# Simple in-memory "database" for demonstration (replace with real DB)
USERS = {
    'demo@abu.test': {
        'password_hash': generate_password_hash('correcthorsebatterystaple'),
        'name': 'Demo User'
    }
}

PRODUCTS = [
    {"id":1, "name":"Eco Toothbrush", "price":3.50, "stock": 120},
    {"id":2, "name":"Reusable Razor", "price":9.99, "stock": 50},
    {"id":3, "name":"Bamboo Comb", "price":2.25, "stock": 200}
]

# Helper: issue a CSRF token and store it in session
def issue_csrf():
    token = secrets.token_urlsafe(32)
    session['csrf_token'] = token
    return token

@app.route('/api/csrf', methods=['GET'])
def get_csrf():
    # Send CSRF as JSON; client should include it in X-CSRF-Token header for mutating requests
    token = session.get('csrf_token') or issue_csrf()
    return jsonify({'csrf_token': token})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    # Basic CSRF check
    header_token = request.headers.get('X-CSRF-Token', '')
    session_token = session.get('csrf_token', '')
    if not session_token or not header_token or header_token != session_token:
        return jsonify({'error':'invalid_csrf'}), 400

    email = data.get('email','').lower().strip()
    password = data.get('password','')
    if not email or not password:
        return jsonify({'error':'missing_fields'}), 400

    user = USERS.get(email)
    if not user or not check_password_hash(user['password_hash'], password):
        # Avoid revealing whether email exists
        time.sleep(0.6)  # rate-limiting/slowdown to deter brute force
        return jsonify({'error':'invalid_credentials'}), 401

    # Successful login: set a short session (demo), in prod use HttpOnly secure cookies + server session store
    session['user'] = {'email': email, 'name': user.get('name')}
    session.permanent = False

    # issue new csrf token for subsequent requests
    issue_csrf()

    return jsonify({'ok': True, 'name': user.get('name')})

@app.route('/api/products', methods=['GET'])
def api_products():
    # Public endpoint: return product list (in prod, paginate)
    return jsonify({'products': PRODUCTS})

@app.route('/api/cart', methods=['POST'])
def api_cart():
    header_token = request.headers.get('X-CSRF-Token', '')
    if header_token != session.get('csrf_token',''):
        return jsonify({'error':'invalid_csrf'}), 400
    data = request.get_json() or {}
    items = data.get('items', [])
    # naive validation
    if not isinstance(items, list) or len(items) > 50:
        return jsonify({'error':'bad_items'}), 400
    total = 0.0
    for it in items:
        pid = int(it.get('id',0))
        qty = int(it.get('qty',1))
        prod = next((p for p in PRODUCTS if p['id']==pid), None)
        if not prod:
            return jsonify({'error':'unknown_product', 'id': pid}), 400
        if qty < 1 or qty > 100:
            return jsonify({'error':'invalid_qty'}), 400
        total += prod['price'] * qty
    return jsonify({'ok': True, 'total': round(total,2)})

# Serve original static files. We copy the original 'ABU v.2.0/pages' to templates and css/js to static.
@app.route('/', defaults={'p':'index.html'})
@app.route('/<path:p>')
def serve(p):
    # Serve templates for known HTML pages for progressive enhancement; otherwise fallback to static files
    try:
        return send_from_directory('templates', p)
    except Exception:
        return send_from_directory('.', p)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
