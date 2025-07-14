# User API Curl Commands

## Create User

```bash
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "client"
  }'
```

## Get All Users

```bash
curl -X GET http://localhost:5001/api/users \
  -H "Content-Type: application/json"
```

## Get User by ID

```bash
curl -X GET http://localhost:5001/api/users/USER_ID_HERE \
  -H "Content-Type: application/json"
```

## Get Customers Only

```bash
curl -X GET "http://localhost:5001/api/users?customerOnly=true&page=1&limit=10" \
  -H "Content-Type: application/json"
```

## Get Store Staff

```bash
curl -X GET "http://localhost:5001/api/users?role=admin&page=1&limit=10" \
  -H "Content-Type: application/json"
```

## Update User Profile (requires authentication)

```bash
curl -X PUT http://localhost:5001/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "Updated First Name",
    "lastName": "Updated Last Name",
    "phone": "+1234567890"
  }'
```

## Change Password (requires authentication)

```bash
curl -X PUT http://localhost:5001/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }'
```

## Add Address (requires authentication)

```bash
curl -X POST http://localhost:5001/api/users/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "type": "home",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "isDefault": true
  }'
```

## Test with Authentication

First, create a user and get the token:

```bash
# Create user
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

Then use the returned token for authenticated requests:

```bash
# Get profile with token
curl -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer TOKEN_FROM_CREATE_USER_RESPONSE"
```

## Notes

1. Replace `YOUR_TOKEN_HERE` with the actual JWT token
2. Replace `USER_ID_HERE` with the actual user ID
3. The JWT_SECRET issue has been fixed with a fallback value
4. All timestamps are automatically added
5. Passwords are automatically hashed using bcrypt
6. Email validation is enforced
7. Phone number validation is enforced
8. Role can be: `superadmin`, `admin`, or `client`
9. Status can be: `active`, `inactive`, or `banned` 