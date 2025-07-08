#!/bin/bash

# Test the simplified delivery methods API using curl
# Make sure to replace YOUR_JWT_TOKEN_HERE with a valid token

BASE_URL="http://localhost:5001/api"
DELIVERY_METHOD_ID="686cc4aedd388afb6a5bc099"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

echo "🧪 Testing Simplified Delivery Methods API..."
echo "💡 Note: No store filtering needed since ID is unique across table"
echo "⚠️  Make sure to replace YOUR_JWT_TOKEN_HERE with a valid token"
echo ""

# Test 1: Set delivery method as default
echo "1️⃣ Testing PATCH /api/delivery-methods/{id}/set-default"
echo "curl -X PATCH \"$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID/set-default\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $JWT_TOKEN\""
echo ""

response=$(curl -s -X PATCH "$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $response"
echo ""

# Test 2: Toggle active status
echo "2️⃣ Testing PATCH /api/delivery-methods/{id}/toggle-active"
echo "curl -X PATCH \"$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID/toggle-active\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $JWT_TOKEN\""
echo ""

response=$(curl -s -X PATCH "$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $response"
echo ""

# Test 3: Get delivery method by ID
echo "3️⃣ Testing GET /api/delivery-methods/{id}"
echo "curl -X GET \"$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID\" \\"
echo "  -H \"Authorization: Bearer $JWT_TOKEN\""
echo ""

response=$(curl -s -X GET "$BASE_URL/delivery-methods/$DELIVERY_METHOD_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response: $response"
echo ""

echo "✅ Tests completed!"
echo ""
echo "💡 To get a JWT token, run:"
echo "curl -X POST \"$BASE_URL/auth/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"your-email@example.com\", \"password\": \"your-password\"}'" 