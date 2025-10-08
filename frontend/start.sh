#!/bin/sh

# Generate config.json from environment variables at runtime
echo "Generating runtime configuration..."

# Create config.json with the backend URL from environment variable
cat > /app/build/config.json << EOF
{
  "REACT_APP_BACKEND_URL": "${REACT_APP_BACKEND_URL:-http://localhost:3001}"
}
EOF

echo "Runtime configuration generated:"
cat /app/build/config.json

# Start the application
echo "Starting application..."
exec serve -s build -l 3000
