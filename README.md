# BringUs SaaS Ecommerce Backend

A comprehensive multi-tenant SaaS ecommerce backend API built with Node.js, Express, and MongoDB. This platform supports multiple stores with complete data isolation, comprehensive product management, and robust authentication systems.

## 🏗️ Project Architecture

### Architecture Pattern
This project follows a **layered architecture** with clear separation of concerns:

- **Routes Layer**: API endpoint definitions and request routing
- **Controllers Layer**: Business logic and request handling
- **Models Layer**: Data models and database schemas
- **Middleware Layer**: Authentication, authorization, and request processing
- **Utils Layer**: Helper functions and utilities

### Folder Structure

```
BringUs-BackEnd/
├── 📁 Controllers/          # Business logic and request handlers
├── 📁 Models/              # MongoDB schemas and data models
├── 📁 Routes/              # API route definitions
├── 📁 middleware/          # Authentication, authorization, and custom middleware
├── 📁 config/              # Database and configuration files
├── 📁 utils/               # Helper functions and utilities
├── 📁 scripts/             # Database seeding and utility scripts
├── 📁 docs/                # API documentation
├── 📁 curl-commands/       # Example API calls
├── 📁 data/                # Sample data files
├── 📁 examples/            # Code examples and tests
└── server.js               # Main application entry point
```

## 🚀 Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Swagger/OpenAPI 3.0
- **File Upload**: Multer
- **Cloud Storage**: AWS SDK
- **Compression**: compression
- **Logging**: Morgan

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BringUs-BackEnd
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bringus?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# AWS Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### 4. Database Setup
```bash
# Create super admin user
npm run create-admin

# Run database seeding scripts (optional)
node scripts/createTestData.js
```

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5001`

## 🔐 Authentication System

### JWT-Based Authentication
The application uses JWT tokens for secure authentication:

- **Token Generation**: Automatic JWT generation on login/register
- **Token Validation**: Middleware validates tokens on protected routes
- **Role-Based Access**: Supports `superadmin`, `admin`, and `client` roles
- **Store Isolation**: Users are associated with specific stores

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password with token | ❌ |

### Sample Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# 2. Login to get JWT token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 3. Use token for authenticated requests
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📡 API Documentation

### Swagger UI
Interactive API documentation is available at:
```
http://localhost:5001/api-docs
```

### Available API Endpoints

#### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### 👥 Users
- `GET /api/users` - Get all users (Admin/Superadmin)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/customers` - Get store customers
- `GET /api/users/staff` - Get store staff

#### 🏪 Stores
- `GET /api/stores` - Get all stores
- `POST /api/stores` - Create new store
- `GET /api/stores/:id` - Get store by ID
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store

#### 👑 Store Owners
- `GET /api/owners` - Get store owners
- `POST /api/owners` - Create store owner
- `GET /api/owners/:id` - Get owner by ID
- `PUT /api/owners/:id` - Update owner
- `DELETE /api/owners/:id` - Delete owner

#### 📦 Product Management
- `GET /api/meta/categories` - Get categories
- `POST /api/meta/categories` - Create category
- `GET /api/meta/product-labels` - Get product labels
- `POST /api/meta/product-labels` - Create product label
- `GET /api/meta/product-specifications` - Get specifications
- `POST /api/meta/product-specifications` - Create specification
- `GET /api/meta/units` - Get units
- `POST /api/meta/units` - Create unit

#### 🚚 Delivery & Payment
- `GET /api/delivery-methods` - Get delivery methods
- `POST /api/delivery-methods` - Create delivery method
- `GET /api/payment-methods` - Get payment methods
- `POST /api/payment-methods` - Create payment method

#### 📢 Marketing
- `GET /api/advertisements` - Get advertisements
- `POST /api/advertisements` - Create advertisement
- `GET /api/store-sliders` - Get store sliders
- `POST /api/store-sliders` - Create store slider

#### 📊 Analytics
- `GET /api/stock-preview` - Get stock preview data
- `GET /api/stock-preview/summary` - Get stock summary
- `GET /api/affiliations` - Get affiliations

#### 📋 Other
- `GET /api/wholesalers` - Get wholesalers
- `GET /api/terms-conditions` - Get terms & conditions
- `GET /api/health` - Health check
- `GET /api` - API information

## 🏗️ Multi-Tenant Architecture

### Store Isolation
The platform implements complete data isolation between stores:

- **Database Level**: All models include a `store` field for filtering
- **Middleware**: Automatic store context injection
- **Access Control**: Users can only access their associated store's data
- **API Design**: All endpoints support store-specific operations

### Store Context
Every API request must include store context either through:
- User's default store (from JWT token)
- Explicit `storeId` parameter (for superadmin testing)
- Store-specific endpoints

## 🔒 Security Features

### Middleware Stack
1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiting**: 1000 requests per 15 minutes
4. **Compression**: Response compression
5. **Morgan**: Request logging
6. **Authentication**: JWT validation
7. **Authorization**: Role-based access control
8. **Store Isolation**: Multi-tenant data separation

### Security Headers
- Content Security Policy (CSP)
- Cross-Origin Resource Policy
- Referrer Policy
- X-Frame-Options
- X-Content-Type-Options

## 🛠️ Development Workflow

### Adding New API Endpoints

To add a new API endpoint, follow this structure:

1. **Create/Update Model** (`Models/YourModel.js`)
```javascript
const mongoose = require('mongoose');

const yourModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  // ... other fields
}, { timestamps: true });

module.exports = mongoose.model('YourModel', yourModelSchema);
```

2. **Create Controller** (`Controllers/YourController.js`)
```javascript
const YourModel = require('../Models/YourModel');
const { addStoreFilter } = require('../middleware/storeIsolation');

exports.getAll = async (req, res) => {
  try {
    const query = addStoreFilter(req);
    const items = await YourModel.find(query);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

3. **Create Route** (`Routes/yourModel.js`)
```javascript
const express = require('express');
const { protect } = require('../middleware/auth');
const { getAll } = require('../Controllers/YourController');

const router = express.Router();

/**
 * @swagger
 * /api/your-model:
 *   get:
 *     summary: Get all items
 *     tags: [YourModel]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, getAll);

module.exports = router;
```

4. **Register Route** (`server.js`)
```javascript
const yourModelRoutes = require('./Routes/yourModel');
app.use('/api/your-model', yourModelRoutes);
```

### Best Practices

1. **Always include Swagger documentation** for new endpoints
2. **Use store isolation middleware** for multi-tenant data
3. **Implement proper validation** using express-validator
4. **Follow the existing error handling patterns**
5. **Add appropriate authentication and authorization**

## 🧪 Testing

### API Testing with CURL
Example CURL commands are provided in the `curl-commands/` directory for each module.

### Testing Authentication
```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test API info
curl http://localhost:5001/api
```

### Testing Protected Endpoints
```bash
# Get JWT token first
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bringus.com","password":"password123"}' | \
  jq -r '.token')

# Use token for protected requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/stores
```

## 📊 Database Models

### Core Models
- **User**: User accounts with roles and store associations
- **Store**: Multi-tenant store configurations
- **Owner**: Store ownership and permissions
- **Category**: Hierarchical product categories
- **Product**: Product information and variants
- **Order**: Customer orders and transactions
- **DeliveryMethod**: Store-specific delivery options
- **PaymentMethod**: Store-specific payment options

### Supporting Models
- **Advertisement**: Marketing content
- **StoreSlider**: Homepage sliders
- **StockPreview**: Inventory management
- **Affiliation**: Partner relationships
- **Wholesaler**: Supplier management
- **TermsConditions**: Legal documents

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set all required environment variables
2. **Database**: Use MongoDB Atlas or production MongoDB instance
3. **Security**: Change default JWT secret and implement proper CORS
4. **Monitoring**: Add application monitoring and logging
5. **SSL**: Use HTTPS in production
6. **Rate Limiting**: Adjust rate limits for production traffic

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 📝 Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive Swagger documentation
3. Include proper error handling
4. Test your changes thoroughly
5. Update this README if needed

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@bringus.com
- Documentation: `/api-docs` endpoint
- Issues: Create an issue in the repository

---

**BringUs SaaS Ecommerce Backend** - Empowering multi-store ecommerce platforms with robust APIs and complete data isolation. 