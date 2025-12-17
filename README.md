# Purpose

This repo holds our web SDK clients. Currently we have SDKs for our managed documents and screen recording features.

# Developing

To build the packages run `npm run build` in the root.

# Releasing

After building, navigate to the desired package folder and run `npm publish` from that directory.

## JWT claims (examples)

The Python examples under `examples/python/` show how to generate the JWT used by the clients. Standard claims are required (`iss`, `aud`, `iat`, `nbf`, `exp`, plus user `sub`/`email`). `business_external_id` and `application.product_id` are optional—include them only if you track them. See `examples/python/README.md` for usage details.
