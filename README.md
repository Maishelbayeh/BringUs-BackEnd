# BringUs Ecommerce Backend

A comprehensive Node.js backend API for an ecommerce system built with Express.js and MongoDB.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Admin, Moderator)
  - Password encryption with bcrypt
  - Password reset functionality

- **Product Management**
  - CRUD operations for products
  - Product categories with hierarchical structure
  - Product variants and attributes
  - Inventory management
  - Search and filtering capabilities
  - Featured and sale products

- **Order Management**
  - Complete order lifecycle
  - Order tracking and status updates
  - Multiple payment methods
  - Shipping information
  - Order cancellation

- **User Management**
  - User profiles and addresses
  - Wishlist functionality
  - Order history

- **Security Features**
  - Input validation with express-validator
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Request compression

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BringUs-BackEnd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/bringus-ecommerce

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads

   # Email Configuration (for future use)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Payment Configuration (for future use)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```
GET /api/products?page=1&limit=10&category=categoryId&minPrice=10&maxPrice=100&brand=brandName&rating=4&sort=price_asc&search=keyword
```

#### Get Single Product
```
GET /api/products/:id
```

#### Create Product (Admin)
```
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "categoryId",
  "sku": "SKU123",
  "stock": 100,
  "brand": "Brand Name"
}
```

#### Update Product (Admin)
```
PUT /api/products/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 89.99
}
```

#### Delete Product (Admin)
```
DELETE /api/products/:id
Authorization: Bearer <admin-token>
```

### Category Endpoints

#### Get All Categories
```
GET /api/categories
```

#### Get Category Tree
```
GET /api/categories/tree
```

#### Create Category (Admin)
```
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Category Name",
  "description": "Category description",
  "parent": "parentCategoryId"
}
```

### Order Endpoints

#### Create Order
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "productId",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "country": "United States"
  },
  "billingAddress": { ... },
  "paymentInfo": {
    "method": "credit_card"
  },
  "shippingInfo": {
    "method": "standard",
    "cost": 10.00
  }
}
```

#### Get User Orders
```
GET /api/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Single Order
```
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin)
```
PUT /api/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "carrier": "FedEx"
}
```

### User Endpoints

#### Get User Profile
```
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Add Address
```
POST /api/users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "home",
  "street": "123 Main St",
  "city": "City",
  "state": "State",
  "zipCode": "12345",
  "country": "United States",
  "isDefault": true
}
```

## 🔧 Project Structure

```
BringUs-BackEnd/
├── config/
│   └── database.js          # Database configuration
├── Controllers/             # Route controllers (to be implemented)
├── middleware/
│   └── auth.js             # Authentication middleware
├── Models/
│   ├── User.js             # User model
│   ├── Product.js          # Product model
│   ├── Category.js         # Category model
│   └── Order.js            # Order model
├── Routes/
│   ├── auth.js             # Authentication routes
│   ├── user.js             # User routes
│   ├── product.js          # Product routes
│   ├── category.js         # Category routes
│   └── order.js            # Order routes
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## 🚀 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (to be implemented)

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS protection
- Security headers with Helmet

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/bringus-ecommerce |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please contact the development team.

---

**Note**: This is a backend API. You'll need to create a frontend application to interact with these endpoints. 