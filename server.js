const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware with permissive configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "*"],
      styleSrc: ["'self'", "'unsafe-inline'", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "*"],
      imgSrc: ["'self'", "data:", "https:", "*"],
      connectSrc: ["'self'", "*"],
      fontSrc: ["'self'", "*"],
      objectSrc: ["'self'", "*"],
      mediaSrc: ["'self'", "*"],
      frameSrc: ["'self'", "*"],
    },
  },
}));

// CORS configuration - Allow all origins
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Referer', 'User-Agent'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(compression());

// Additional headers middleware - Allow all origins
app.use((req, res, next) => {
  // Set permissive CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 for development
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      message: 'Rate limit exceeded. Please wait 15 minutes before trying again.',
      retryAfter: '15 minutes'
    });
  }
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI =  'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

// Remove deprecated options for newer MongoDB driver
mongoose.connect(MONGODB_URI, {
  // Removed deprecated options: useNewUrlParser and useUnifiedTopology
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import routes
const authRoutes = require('./Routes/auth');
const userRoutes = require('./Routes/userRoutes');
const ownerRoutes = require('./Routes/owner');
const storeRoutes = require('./Routes/store');
const productMetaRoutes = require('./Routes/productMeta');
const deliveryMethodRoutes = require('./Routes/deliveryMethod');
const paymentMethodRoutes = require('./Routes/paymentMethod');
const advertisementRoutes = require('./Routes/advertisement');
const storeSliderRoutes = require('./Routes/storeSlider');
const stockPreviewRoutes = require('./Routes/stockPreview');
const affiliationRoutes = require('./Routes/affiliation');
const categoryRoutes = require('./Routes/category');
const wholesalerRoutes = require('./Routes/wholesaler');
const termsConditionsRoutes = require('./Routes/termsConditions');
// const productRoutes = require('./Routes/product');
// const orderRoutes = require('./Routes/order');

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/meta', productMetaRoutes);
app.use('/api/delivery-methods', deliveryMethodRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/store-sliders', storeSliderRoutes);
app.use('/api/stock-preview', stockPreviewRoutes);
app.use('/api/affiliations', affiliationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wholesalers', wholesalerRoutes);
app.use('/api/terms-conditions', termsConditionsRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API root endpoint
 *     description: Get API information and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "BringUs SaaS Ecommerce API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     users:
 *                       type: string
 *                       example: "/api/users"
 *                     stores:
 *                       type: string
 *                       example: "/api/stores"
 *                     owners:
 *                       type: string
 *                       example: "/api/owners"
 *                     health:
 *                       type: string
 *                       example: "/api/health"
 *                     docs:
 *                       type: string
 *                       example: "/api-docs"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BringUs SaaS Ecommerce API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      stores: '/api/stores',
      owners: '/api/owners',
      meta: '/api/meta',
      deliveryMethods: '/api/delivery-methods',
      paymentMethods: '/api/payment-methods',
      advertisements: '/api/advertisements',
      storeSliders: '/api/store-sliders',
      stockPreview: '/api/stock-preview',
      affiliations: '/api/affiliations',
      categories: '/api/categories',
      wholesalers: '/api/wholesalers',
      termsConditions: '/api/terms-conditions',
      health: '/api/health',
      docs: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "BringUs SaaS Ecommerce API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'BringUs SaaS Ecommerce API is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger UI setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BringUs SaaS Ecommerce API',
      version: '1.0.0',
      description: 'API documentation for the BringUs SaaS Ecommerce backend - Multi-store platform',
      contact: {
        name: 'BringUs Team',
        email: 'support@bringus.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:' + PORT,
        description: 'Development server',
      },
      {
        url: 'https://api.bringus.com',
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['superadmin', 'admin', 'client'], example: 'admin' },
            status: { type: 'string', enum: ['active', 'inactive', 'banned'], example: 'active' },
            phone: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://example.com/avatar.jpg' }
              }
            }
          }
        },
        Store: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'My Store' },
            description: { type: 'string', example: 'A great store' },
            domain: { type: 'string', example: 'mystore' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            settings: {
              type: 'object',
              properties: {
                currency: { type: 'string', example: 'USD' },
                language: { type: 'string', example: 'en' },
                timezone: { type: 'string', example: 'UTC' }
              }
            }
          }
        },
        Owner: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            userId: { $ref: '#/components/schemas/User' },
            storeId: { $ref: '#/components/schemas/Store' },
            permissions: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['manage_store', 'manage_users']
            },
            isPrimaryOwner: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error in development' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success message' },
            data: { type: 'object' },
            count: { type: 'number', example: 10 }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            nameAr: { type: 'string', example: 'إلكترونيات' },
            nameEn: { type: 'string', example: 'Electronics' },
            slug: { type: 'string', example: 'electronics' },
            descriptionAr: { type: 'string', example: 'كل ما يتعلق بالأجهزة الإلكترونية' },
            descriptionEn: { type: 'string', example: 'All about electronics' },
            parent: { $ref: '#/components/schemas/Category' },
            level: { type: 'number', example: 0 },
            sortOrder: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true }
          }
        },
        ProductLabel: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439015' },
            nameAr: { type: 'string', example: 'عادي' },
            nameEn: { type: 'string', example: 'Regular' },
            descriptionAr: { type: 'string', example: 'منتج عادي' },
            descriptionEn: { type: 'string', example: 'Regular product' },
            color: { type: 'string', example: '#6B7280' },
            isActive: { type: 'boolean', example: true },
            sortOrder: { type: 'number', example: 1 }
          }
        },
        Unit: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439016' },
            nameAr: { type: 'string', example: 'قطعة' },
            nameEn: { type: 'string', example: 'Piece' },
            symbol: { type: 'string', example: 'pc' },
            descriptionAr: { type: 'string', example: 'وحدة قياس' },
            descriptionEn: { type: 'string', example: 'Measurement unit' },
            isActive: { type: 'boolean', example: true },
            sortOrder: { type: 'number', example: 1 }
          }
        },
        ProductSpecification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439017' },
            descriptionAr: { type: 'string', example: 'طويل' },
            descriptionEn: { type: 'string', example: 'Long' },
            category: { $ref: '#/components/schemas/Category' },
            isActive: { type: 'boolean', example: true },
            sortOrder: { type: 'number', example: 1 }
          }
        },
        ProductVariant: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439018' },
            productId: { $ref: '#/components/schemas/Product' },
            name: { type: 'string', example: '128GB Black' },
            price: { type: 'number', example: 2500 },
            compareAtPrice: { type: 'number', example: 2700 },
            sku: { type: 'string', example: 'SAMS22-128-BLK' },
            barcode: { type: 'string', example: '1234567890123' },
            stock: { type: 'number', example: 500 },
            colors: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['#000000']
            },
            isActive: { type: 'boolean', example: true },
            isDefault: { type: 'boolean', example: false }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439019' },
            nameAr: { type: 'string', example: 'سامسونج جالاكسي S22' },
            nameEn: { type: 'string', example: 'Samsung Galaxy S22' },
            descriptionAr: { type: 'string', example: 'هاتف ذكي سامسونج' },
            descriptionEn: { type: 'string', example: 'Samsung smartphone' },
            price: { type: 'number', example: 2500 },
            compareAtPrice: { type: 'number', example: 2700 },
            costPrice: { type: 'number', example: 2000 },
            sku: { type: 'string', example: 'SAMS22-001' },
            barcode: { type: 'string', example: '1234567890123' },
            category: { $ref: '#/components/schemas/Category' },
            categoryPath: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/Category' }
            },
            brand: { type: 'string', example: 'Samsung' },
            productLabel: { $ref: '#/components/schemas/ProductLabel' },
            unit: { $ref: '#/components/schemas/Unit' },
            availableQuantity: { type: 'number', example: 980 },
            productOrder: { type: 'number', example: 1 },
            visibility: { type: 'boolean', example: true },
            stock: { type: 'number', example: 980 },
            isActive: { type: 'boolean', example: true },
            isFeatured: { type: 'boolean', example: false },
            isOnSale: { type: 'boolean', example: false },
            salePercentage: { type: 'number', example: 10 },
            rating: { type: 'number', example: 4.5 },
            numReviews: { type: 'number', example: 25 },
            views: { type: 'number', example: 150 },
            soldCount: { type: 'number', example: 50 }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Stores', description: 'Store management endpoints' },
      { name: 'Owners', description: 'Store ownership management endpoints' },
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'ProductLabels', description: 'Product label management endpoints' },
      { name: 'ProductSpecifications', description: 'Product specification management endpoints' },
      { name: 'ProductVariants', description: 'Product variant management endpoints' },
      { name: 'Units', description: 'Product unit management endpoints' },
      { name: 'Products', description: 'Product management endpoints' }
    ]
  },
  apis: ['./Routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});

module.exports = app; 