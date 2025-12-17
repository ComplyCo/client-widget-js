"""
Flask Example: JWT Token Generation Endpoint

Requirements:
    pip install flask pyjwt cryptography

Usage:
    python flask_example.py
"""

import os
from flask import Flask, jsonify, request, make_response
from jwt_utils import generate_jwt_token


app = Flask(__name__)


# Load private key from environment or use example key
PRIVATE_KEY = os.environ.get("PRIVATE_KEY") or """-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmBNZTE/ZWFh9h
4Rd5gmNjs/67b2fgMC1CyaU28Ut7GuBvUK7TyjkIlhXL7NAJndc0Dtbf2B43H9Q8
EDa/CNOvS5cPLM9ytsL+/hGWKnzQwnvUiSyWr2lVbbkMNgazlKx4con0KRxKu4hE
U7TE2+A67nm2clU43oP50biIi8uXxit4saVqNHEoJm8mqE9Sg/rGme82VACI+MIi
Hq8XJpBeK8n8M/+T2JLztPgTb7VXmvfB2ZQrDcE8W2wXKy+KvwzsEEuiHz9zhLSy
5P0t8ld/kBE4eDxiTkMidqvKEpC/enTFMrOhuo0Wu4+P9wKgGQjbKvo7Lvp9bgCq
xwns77enAgMBAAECggEAFiuvM4kG7JgnuLqGmAOBol73NbC6/oVwherH1X6Dxfzg
2/y6XC41T6A7aPBHGAGsK5ePunTyFAp8HUlNBlX3bwF5Ot2RFpCxmbv0PUmPQZG3
V7q56aWjO3VbsPXGD1VbcvpY0fJrhM9mczl6eo+icjxGpMa/+sg8d7A6JIIGvk3R
j819XAT2zMfLYqoRMyJhlkiMdT8vetkmn9/8V7DJLiEw6MFwy6vXZKui3WUoJGZ5
xTkmrnxggWJJe3issC/FpF3xhOEuXPULFIj977p2j1Xox8xd+xQKTN+0yhHwZrAg
DKr2Qnjb1XUgqT2sjJdWsXR/Uwtj8MVNGQnvIQHwgQKBgQDP/d0YPwy2kb+JqjC4
+TU/2MFQY/ucqRpH0S4j9FXHHX/ELZOsup0bOVNs5/FUE7MPLNm5b1JcIu+dcndR
sHC9MJK+UqYApicvOwAd4OcVLfVJApJEnrOFE5aKtbQ51jw3J+dENM83CzBAvkUn
cpAv0bczMIL4OcFi98KNP2qE4wKBgQDMVtJLXpFqgdnJkV4zrmFP+FBZnv3tLNZ6
hSnAQ6j65KOgbTZGS/4Rr/8Kq/YHINiEjeTUbQRu/jHsqVHQfUanIPFyFVyaHjsf
KZ4hgL9CCDsSOQYXXux8gqYMM4c3xTDwfK4ZYx3uMlxUA9H6s70rJiQxhtkzhHT8
SQrM2uLBbQKBgBC6c0ja8VPRvxz8YjTOXlkHPu0PTZJZC3MRQOvFYAzGs5r8q27u
B2rEHpCYyxEfEHy897nxWSdt6+W26h/Y2AhvWq4SCaXttyMWVLkSeKN8ccjwewEn
3npqi+YWHSu1rlwlSnVy5eOgc74RT5CPp0chT+G/GhmK06H5GV2w5wlPAoGAWWQJ
70rZlpxjqBhd+4HntFJO5EX3k9Avq72hfCidPdTT+BSOz8Xiyd4SVprPsGKgFaz1
VDC05dFyCbQwxGJpjCePOHc74XgkKQfN0549DSgIn3ouvf6augV1mpTYLH+pXytM
BnMj3tZNKbvaGjCTKtMutjPlxPHHM67IeMGwvSkCgYBV2brEbuz6UfTNYPNsDC9Z
beCwF/Cr1h53LH3sQRsbdgPZy55WKGO5FUZxUHZ+1AY9zSb759YvCVI9wqowUbv3
eVHZcwTSf81pf+qTrwPjDFqaD7fj+qAg5NQYM+hsPiT0uSTVCbEj8UgrRpV7vt/t
dnIrOS+ZG9PoJKWKF5JjEQ==
-----END PRIVATE KEY-----"""


@app.route('/api/complyco-jwt', methods=['GET'])
def get_complyco_jwt():
    try:
        user_data = get_user_from_session()
        app_data = get_application_data()

        claims = {
            "sub": user_data["user_id"],
            "email": user_data["email"],
            "application": {
                "id": app_data["application_id"],
                "institution_id": app_data["institution_id"],
            }
        }

        if user_data.get("business_external_id"):
            claims["business_external_id"] = user_data["business_external_id"]
        if app_data.get("product_id"):
            claims["application"]["product_id"] = app_data["product_id"]

        token = generate_jwt_token(
            private_key=PRIVATE_KEY,
            expiration_minutes=60,
            claims=claims,
        )

        return jsonify({
            'token': token,
            'token_type': 'Bearer',
            'expires_in': 3600
        })

    except Exception as e:
        return jsonify({
            'error': 'Failed to generate token',
            'detail': str(e)
        }), 500


def get_user_from_session():
    """Get user info from session/auth - replace with your logic"""
    # TODO: Implement your authentication
    # Examples:
    # - user_id = session.get('user_id')
    # - token = request.headers.get('Authorization')
    # - user = decode_session_token(token)

    return {
        'user_id': 'user_12345',
        'email': 'user@example.com',
        'business_external_id': 'biz_6789',  # optional
    }


def get_application_data():
    """Get application data - replace with your logic"""
    # TODO: Implement your data retrieval
    # Examples:
    # - app_id = request.args.get('application_id')
    # - app = db.query(Application).filter_by(id=app_id).first()

    return {
        'application_id': 'ext_app_001',
        'product_id': 'deposit',  # optional
        'institution_id': 'bank_a'
    }


@app.route('/')
def index():
    return jsonify({
        'message': 'ComplyKo JWT Token Service',
        'endpoints': {
            'jwt_token': '/api/complyco-jwt',
            'health': '/health'
        }
    })


@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    print("=" * 70)
    print("ComplyKo JWT Token Service - Flask")
    print("=" * 70)
    print("\nJWT Endpoint: http://localhost:5000/api/complyco-jwt")
    print("\nPress CTRL+C to stop\n")
    print("=" * 70)

    app.run(host='0.0.0.0', port=5000, debug=True)
