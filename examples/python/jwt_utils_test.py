#!/usr/bin/env python3
"""
JWT Token Generation Example with RSA Key Pair Signing

This example demonstrates how to generate JWT tokens for API authentication
using RSA public/private key cryptography (RS256 algorithm).

Requirements:
    pip install pyjwt cryptography

Usage:
    python jwt_utils_test.py
"""

import datetime
from jwt_utils import generate_jwt_token

# Example RSA Private Key (PEM format)
# WARNING: This is a well-known example key pair for demonstration purposes only.
# NEVER use these keys in production. Generate your own secure key pair.
PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
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

# Example RSA Public Key (PEM format)
# This public key corresponds to the private key above
PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApgTWUxP2VhYfYeEXeYJj
Y7P+u29n4DAtQsmlNvFLexrgb1Cu08o5CJYVy+zQCZ3XNA7W39geNx/UPBA2vwjT
r0uXDyzPcrbC/v4Rlip80MJ71Ikslq9pVW25DDYGs5SseHKJ9CkcSruIRFO0xNvg
Ou55tnJVON6D+dG4iIvLl8YreLGlajRxKCZvJqhPUoP6xpnvNlQAiPjCIh6vFyaQ
XivJ/DP/k9iS87T4E2+1V5r3wdmUKw3BPFtsFysvir8M7BBLoh8/c4S0suT9LfJX
f5AROHg8Yk5DInaryhKQv3p0xTKzobqNFruPj/cCoBkI2yr6Oy76fW4AqscJ7O+3
pwIDAQAB
-----END PUBLIC KEY-----"""


def main():
    """
    Example usage of JWT token generation and verification.
    """
    print("=" * 70)
    print("JWT Token Generation Example")
    print("=" * 70)
    print()

    # Generate the token
    token = generate_jwt_token(
        private_key=PRIVATE_KEY,
        expiration_minutes=60
    )

    print("Generated JWT Token:")
    print("-" * 70)
    print(token)
    print("-" * 70)
    print()
    print()
    print("Include the token in the Authorization header of your HTTP requests:")
    print()
    print("  Authorization: Bearer <your-jwt-token>")
    print()
    print("=" * 70)
    print()
    print("IMPORTANT SECURITY NOTES:")
    print("  1. Replace the example keys with your own production key pair")
    print("  2. Keep your private key secure and never commit it to version control")
    print("  3. Share only the public key with the API service")
    print("  4. Use environment variables or secure vaults for key storage")
    print("=" * 70)


if __name__ == "__main__":
    main()
