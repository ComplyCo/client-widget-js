# API Integration Examples

This directory contains example code to help you integrate with our API services.

## JWT Token Generation Example

### Overview

The `jwt_utils_test.py` script demonstrates how to generate JWT tokens for API authentication using RSA public/private key cryptography (RS256 algorithm).

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Install the required Python packages:

```bash
pip install -r requirements.txt
```

### Usage

Run the example script:

```bash
python jwt_utils_test.py
```

This will:

1. Generate a JWT token with example credentials
2. Display the generated token
3. Verify the token using the public key

### Customization

To use the script in your application:

1. **Replace the example keys** with your own RSA key pair:
    - Generate your keys using OpenSSL or your preferred tool
    - Keep your private key secure
    - Share your public key with our API service

2. **Use the token in your Frontend API requests**:

   ```python
   import requests

   headers = {"Authorization": f"Bearer {token}"}
   response = requests.get(
       "https://<your-client-id>.complyco.com/api/example-endpoint",
       headers=headers
   )
   ```

### Generating Your Own Key Pair

To generate a new RSA key pair for production use:

```bash
# Generate private key
openssl genrsa -out private_key.pem 2048

# Extract public key
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** or secure vaults to store keys
3. **Rotate keys regularly** for enhanced security
4. **Use appropriate token expiration times** (default is 60 minutes)
5. **Protect your private key** - anyone with access to it can generate valid tokens

### Integrate with @complyco/client-recorder-web

Install our client-recorder package: https://www.npmjs.com/package/@complyco/client-recorder-web. You can view the source code at GitHub: https://github.com/ComplyCo/client-widget-js

See Onboarding documentation: https://www.notion.so/complyco/Onboarding-the-recorder-2b66c4baab1c80dc9ec1ed6022438031

#### 1. Provide an endpoint on your backend server to provide the JWT

The `jwt_utils.py` module (included in this directory) provides the `generate_jwt_token()` function used in the examples below.

**Flask example:**

```python
from flask import Flask, jsonify
from jwt_utils import generate_jwt_token
import os

app = Flask(__name__)

# Load your private key from environment variable or secure vault
PRIVATE_KEY = os.environ.get('JWT_PRIVATE_KEY')

@app.route('/api/complyco-jwt', methods=['GET'])
def get_complyco_jwt():
     token = generate_jwt_token(
         private_key=PRIVATE_KEY,
         expiration_minutes=60
     )

     return jsonify({
         'token': token
     })
```

#### 2. Add the JWT endpoint to the client recorder

```javascript
// Frontend React example
// See: https://www.npmjs.com/package/@complyco/client-recorder-web

// Initialize the recorder once for your pageload
const recorder = createClientRecorder({
  syncOptions: {
    baseUrl: "/api/complyco-jwt", // <--- Your JWT endpoint path
    onAuthTokenRequested,
    plugins: [GzipPlugin],
  },
});
```

**Note:** The `baseUrl` parameter should point to _your_ backend JWT endpoint (created in step 1) URL.

### Support

If you have questions or need assistance with API integration, please contact our team via slack.
