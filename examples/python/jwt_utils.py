"""
JWT Utility Functions

This module provides utility functions for generating and verifying JWT tokens
using RSA public/private key cryptography (RS256 algorithm).
"""

import jwt
import datetime
from typing import Dict, Any


def generate_jwt_token(
    private_key: str,
    expiration_minutes: int = 60
) -> str:
    """
    Generate a JWT token signed with an RSA private key.

    Args:
        private_key: RSA private key in PEM format
        expiration_minutes: Token expiration time in minutes (default: 60)

    Returns:
        A signed JWT token string

    Example:
        >>> private_key = open('private_key.pem').read()
        >>> token = generate_jwt_token(
        ...     private_key=private_key,
        ...     expiration_minutes=60
        ... )
    """
    now = datetime.datetime.now(datetime.UTC)
    expiration = now + datetime.timedelta(minutes=expiration_minutes)

    # JWT payload (claims)
    payload: Dict[str, Any] = {
        # Standard claims
        "iss": "<your-issuer>",  # From: app.complyco.com/dataSources/clients
        "aud": "<your-app-id>.client.complyco.com",  # From: app.complyco.com/dataSources/clients
        "iat": now,  # Issued at
        "exp": expiration,  # Expiration time
        "nbf": now,  # Not before

        "sub": "<user ID from your session>",
        "email": "<user email from your session>",
        "application" : {
            "id": "<application_external_id>", # External Application ID from your system
            "product_id": "<product_external_id>", # e.g. "deposit" from app.complyco.com/configuration/financialProducts
            "institution_id": "<institution_external_id>", #  e.g. "bank_a" from app.complyco.com/configuration/institutions
        }
    }

    # Generate the JWT token using RS256 algorithm
    token = jwt.encode(
        payload,
        private_key,
        algorithm="RS256"
    )

    return token
