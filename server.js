const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cookieParser = require('cookie-parser');
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Referer', 'User-Agent', 'x-guest-id'],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'X-Guest-ID'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(compression());

// Additional headers middleware - Allow all origins
app.use((req, res, next) => {
  // Set permissive CORS headers
  res.header('X-Guest-ID', req.cookies?.guestId || '');
  res.header('Referrer-Policy', 'no-referrer-when-downgrade');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent, x-guest-id');
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

// Cookie parsing middleware
app.use(cookieParser());

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
const userRoutes = require('./Routes/user');
const userRoutes2 = require('./Routes/userRoutes');
const storeRoutes = require('./Routes/store');
const ownerRoutes = require('./Routes/owner');
const productMetaRoutes = require('./Routes/productMeta');
const deliveryMethodRoutes = require('./Routes/deliveryMethod');
const paymentMethodRoutes = require('./Routes/paymentMethod');
const advertisementRoutes = require('./Routes/advertisement');
const storeSliderRoutes = require('./Routes/storeSlider');
const affiliationRoutes = require('./Routes/affiliation');
const categoryRoutes = require('./Routes/category');
const wholesalerRoutes = require('./Routes/wholesaler');
const termsConditionsRoutes = require('./Routes/termsConditions');
const productRoutes = require('./Routes/product');
const socialCommentRoutes = require('./Routes/socialComment');
const orderRoutes = require('./Routes/order');
const likesRoutes = require('./Routes/likes');
const cartRoutes = require('./Routes/cart.routes');
const superadminRoutes = require('./Routes/superadmin');
const subscriptionRoutes = require('./Routes/subscription');
const subscriptionPlanRoutes = require('./Routes/subscriptionPlan');
const storeInfoRoutes = require('./Routes/storeInfo');
const subscriptionRenewalRoutes = require('./Routes/subscriptionRenewal');
const emailVerificationRoutes = require('./Routes/emailVerification');
const passwordResetRoutes = require('./Routes/passwordReset');
const posCartRoutes = require('./Routes/posCart');

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);    
  app.use('/api/users', userRoutes2);
app.use('/api/owners', ownerRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/meta', productMetaRoutes);
app.use('/api/delivery-methods', deliveryMethodRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/store-sliders', storeSliderRoutes);
app.use('/api/affiliations', affiliationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wholesalers', wholesalerRoutes);
app.use('/api/terms-conditions', termsConditionsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/social-comments', socialCommentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/store-info', storeInfoRoutes);
app.use('/api/subscription-renewal', subscriptionRenewalRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/pos-cart', posCartRoutes);

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
      users2: '/api/users2',
      storeInfo: '/api/store-info',
      stores: '/api/stores',
      owners: '/api/owners',
      meta: '/api/meta',
      deliveryMethods: '/api/delivery-methods',
      paymentMethods: '/api/payment-methods',
      advertisements: '/api/advertisements',
      storeSliders: '/api/store-sliders',
      affiliations: '/api/affiliations',
      categories: '/api/categories',
      products: '/api/products',
      wholesalers: '/api/wholesalers',
      termsConditions: '/api/terms-conditions',
      superadmin: '/api/superadmin',
      subscriptionRenewal: '/api/subscription-renewal',
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
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            nameAr: { type: 'string', example: 'متجر الإلكترونيات' },
            nameEn: { type: 'string', example: 'Electronics Store' },
            descriptionAr: { type: 'string', example: 'متجر متخصص في الأجهزة الإلكترونية' },
            descriptionEn: { type: 'string', example: 'Specialized electronics store' },
            logo: {
              type: 'object',
              properties: {
                public_id: { type: 'string', example: 'store-logos/1234567890-logo.png' },
                url: { type: 'string', example: 'https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/store-logos/1234567890-logo.png' }
              }
            },
            slug: { type: 'string', example: 'electronics-store' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            settings: {
              type: 'object',
              properties: {
                currency: { type: 'string', example: 'ILS' },
                mainColor: { type: 'string', example: '#000000' },
                language: { type: 'string', example: 'en' },
                storeDiscount: { type: 'number', example: 0 },
                timezone: { type: 'string', example: 'UTC' },
                taxRate: { type: 'number', example: 0 },
                shippingEnabled: { type: 'boolean', example: true },
                storeSocials: {
                  type: 'object',
                  properties: {
                    facebook: { type: 'string', example: 'https://facebook.com/mystore' },
                    instagram: { type: 'string', example: 'https://instagram.com/mystore' },
                    twitter: { type: 'string', example: 'https://twitter.com/mystore' },
                    youtube: { type: 'string', example: 'https://youtube.com/mystore' },
                    linkedin: { type: 'string', example: 'https://linkedin.com/mystore' },
                    telegram: { type: 'string', example: 'https://t.me/mystore' },
                    snapchat: { type: 'string', example: 'mystore' },
                    pinterest: { type: 'string', example: 'https://pinterest.com/mystore' },
                    tiktok: { type: 'string', example: 'https://tiktok.com/@mystore' }
                  }
                }
              }
            },
            whatsappNumber: { type: 'string', example: '+1234567890' },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email', example: 'contact@mystore.com' },
                phone: { type: 'string', example: '+1234567890' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '123 Main St' },
                    city: { type: 'string', example: 'New York' },
                    state: { type: 'string', example: 'NY' },
                    zipCode: { type: 'string', example: '10001' },
                    country: { type: 'string', example: 'USA' }
                  }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        StoreWithOwners: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            nameAr: { type: 'string', example: 'متجر الإلكترونيات' },
            nameEn: { type: 'string', example: 'Electronics Store' },
            descriptionAr: { type: 'string', example: 'متجر متخصص في الأجهزة الإلكترونية' },
            descriptionEn: { type: 'string', example: 'Specialized electronics store' },
            logo: {
              type: 'object',
              properties: {
                public_id: { type: 'string', example: 'store-logos/1234567890-logo.png' },
                url: { type: 'string', example: 'https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/store-logos/1234567890-logo.png' }
              }
            },
            slug: { type: 'string', example: 'electronics-store' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            settings: {
              type: 'object',
              properties: {
                currency: { type: 'string', example: 'ILS' },
                mainColor: { type: 'string', example: '#000000' },
                language: { type: 'string', example: 'en' },
                storeDiscount: { type: 'number', example: 0 },
                timezone: { type: 'string', example: 'UTC' },
                taxRate: { type: 'number', example: 0 },
                shippingEnabled: { type: 'boolean', example: true },
                storeSocials: {
                  type: 'object',
                  properties: {
                    facebook: { type: 'string', example: 'https://facebook.com/mystore' },
                    instagram: { type: 'string', example: 'https://instagram.com/mystore' },
                    twitter: { type: 'string', example: 'https://twitter.com/mystore' },
                    youtube: { type: 'string', example: 'https://youtube.com/mystore' },
                    linkedin: { type: 'string', example: 'https://linkedin.com/mystore' },
                    telegram: { type: 'string', example: 'https://t.me/mystore' },
                    snapchat: { type: 'string', example: 'mystore' },
                    pinterest: { type: 'string', example: 'https://pinterest.com/mystore' },
                    tiktok: { type: 'string', example: 'https://tiktok.com/@mystore' }
                  }
                }
              }
            },
            whatsappNumber: { type: 'string', example: '+1234567890' },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email', example: 'contact@mystore.com' },
                phone: { type: 'string', example: '+1234567890' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '123 Main St' },
                    city: { type: 'string', example: 'New York' },
                    state: { type: 'string', example: 'NY' },
                    zipCode: { type: 'string', example: '10001' },
                    country: { type: 'string', example: 'USA' }
                  }
                }
              }
            },
            owners: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                  userId: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
                      firstName: { type: 'string', example: 'أحمد' },
                      lastName: { type: 'string', example: 'محمد' },
                      email: { type: 'string', example: 'ahmed@example.com' },
                      phone: { type: 'string', example: '+1234567890' },
                      status: { type: 'string', example: 'active' },
                      isActive: { type: 'boolean', example: true }
                    }
                  },
                  status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['manage_products', 'manage_orders', 'manage_users']
                  },
                  isPrimaryOwner: { type: 'boolean', example: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        StoreSubscription: {
          type: 'object',
          properties: {
            isSubscribed: { type: 'boolean', example: true },
            plan: { 
              type: 'string', 
              enum: ['free', 'monthly', 'quarterly', 'semi_annual', 'annual'], 
              example: 'monthly' 
            },
            startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            endDate: { type: 'string', format: 'date-time', example: '2024-02-01T00:00:00.000Z' },
            lastPaymentDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            nextPaymentDate: { type: 'string', format: 'date-time', example: '2024-02-01T00:00:00.000Z' },
            trialEndDate: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            autoRenew: { type: 'boolean', example: true },
            paymentMethod: { 
              type: 'string', 
              enum: ['credit_card', 'paypal', 'bank_transfer', 'cash'], 
              example: 'credit_card' 
            },
            amount: { type: 'number', example: 99.99 },
            currency: { type: 'string', example: 'USD' }
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
            titleAr: { type: 'string', example: 'اللون' },
            titleEn: { type: 'string', example: 'Color' },
            values: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  valueAr: { type: 'string', example: 'أحمر' },
                  valueEn: { type: 'string', example: 'Red' }
                },
                required: ['valueAr', 'valueEn']
              },
              example: [
                { valueAr: 'أحمر', valueEn: 'Red' },
                { valueAr: 'أزرق', valueEn: 'Blue' },
                { valueAr: 'أخضر', valueEn: 'Green' }
              ]
            },
            category: { $ref: '#/components/schemas/Category' },
            isActive: { type: 'boolean', example: true },
            sortOrder: { type: 'number', example: 1 },
            store: { $ref: '#/components/schemas/Store' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['titleAr', 'titleEn', 'values', 'store']
        },
        // ProductVariant: {
        //   type: 'object',
        //   properties: {
        //     _id: { type: 'string', example: '507f1f77bcf86cd799439018' },
        //     productId: { $ref: '#/components/schemas/Product' },
        //     name: { type: 'string', example: '128GB Black' },
        //     price: { type: 'number', example: 2500 },
        //     compareAtPrice: { type: 'number', example: 2700 },
        //     sku: { type: 'string', example: 'SAMS22-128-BLK' },
        //     barcode: { type: 'string', example: '1234567890123' },
        //     stock: { type: 'number', example: 500 },
        //     colors: { 
        //       type: 'array', 
        //       items: { type: 'string' },
        //       example: ['#000000']
        //     },
        //     isActive: { type: 'boolean', example: true },
        //     isDefault: { type: 'boolean', example: false }
        //   }
        // },
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
            barcode: { type: 'string', example: '1234567890123' },
            category: { $ref: '#/components/schemas/Category' },
            store: { $ref: '#/components/schemas/Store' },
            images: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
            },
            mainImage: { type: 'string', example: 'https://example.com/main-image.jpg' },
            productLabels: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/ProductLabel' }
            },
            unit: { $ref: '#/components/schemas/Unit' },
            availableQuantity: { type: 'number', example: 980 },
            productOrder: { type: 'number', example: 1 },
            visibility: { type: 'boolean', example: true },
            attributes: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Material' },
                  value: { type: 'string', example: 'Cotton' }
                }
              }
            },
            specifications: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/ProductSpecification' }
            },
            stock: { type: 'number', example: 980 },
            lowStockThreshold: { type: 'number', example: 5 },
            weight: { type: 'number', example: 0.2 },
            dimensions: {
              type: 'object',
              properties: {
                length: { type: 'number', example: 70 },
                width: { type: 'number', example: 50 },
                height: { type: 'number', example: 5 }
              }
            },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['phone', 'samsung', 'smartphone']
            },
            colors: { 
              type: 'array', 
              items: { 
                type: 'array',
                items: { type: 'string' }
              },
              example: [['#000000'], ['#FFFFFF', '#FF0000']]
            },
            isActive: { type: 'boolean', example: true },
            isFeatured: { type: 'boolean', example: false },
            isOnSale: { type: 'boolean', example: false },
            salePercentage: { type: 'number', example: 10 },
            rating: { type: 'number', example: 4.5 },
            numReviews: { type: 'number', example: 25 },
            views: { type: 'number', example: 150 },
            soldCount: { type: 'number', example: 50 },
            seo: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Samsung Galaxy S22 - Premium Smartphone' },
                description: { type: 'string', example: 'High-quality Samsung smartphone' },
                keywords: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['samsung', 'smartphone', 'galaxy']
                }
              }
            },
            discountPercentage: { type: 'number', example: 7 },
            finalPrice: { type: 'number', example: 2325 },
            stockStatus: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'], example: 'in_stock' },
            allColors: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['#000000', '#FFFFFF', '#FF0000']
            },
            colorOptionsCount: { type: 'number', example: 2 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439020' },
            userId: { $ref: '#/components/schemas/User' },
            storeId: { $ref: '#/components/schemas/Store' },
            plan: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439021' },
                name: { type: 'string', example: 'Basic Plan' },
                price: { type: 'number', example: 100 },
                features: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['10 products', '100 orders', '1000 visitors']
                },
                duration: { type: 'string', example: '1 month' },
                isActive: { type: 'boolean', example: true }
              }
            },
            status: { type: 'string', enum: ['active', 'inactive', 'cancelled'], example: 'active' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            paymentMethod: { type: 'string', example: 'credit card' },
            paymentStatus: { type: 'string', enum: ['paid', 'pending', 'failed'], example: 'paid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Premium Monthly'
            },
            nameAr: {
              type: 'string',
              example: 'بريميوم شهري'
            },
            description: {
              type: 'string',
              example: 'Premium monthly subscription with unlimited features'
            },
            descriptionAr: {
              type: 'string',
              example: 'اشتراك شهري بريميوم مع ميزات غير محدودة'
            },
            type: {
              type: 'string',
              enum: ['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom'],
              example: 'monthly'
            },
            duration: {
              type: 'integer',
              example: 30
            },
            price: {
              type: 'number',
              example: 99.99
            },
            currency: {
              type: 'string',
              enum: ['USD', 'EUR', 'ILS', 'SAR', 'AED', 'EGP'],
              example: 'USD'
            },
            features: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Unlimited Products'
                  },
                  nameAr: {
                    type: 'string',
                    example: 'منتجات غير محدودة'
                  },
                  description: {
                    type: 'string',
                    example: 'Add unlimited products to your store'
                  },
                  descriptionAr: {
                    type: 'string',
                    example: 'أضف منتجات غير محدودة لمتجرك'
                  },
                  included: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isPopular: {
              type: 'boolean',
              example: false
            },
            sortOrder: {
              type: 'integer',
              example: 1
            },
            maxProducts: {
              type: 'integer',
              example: -1
            },
            maxOrders: {
              type: 'integer',
              example: -1
            },
            maxUsers: {
              type: 'integer',
              example: -1
            },
            storageLimit: {
              type: 'integer',
              example: -1
            },
            customFeatures: {
              type: 'object',
              example: {}
            },
            createdBy: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string'
                },
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            updatedBy: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string'
                },
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Stores', description: 'Store management endpoints' },
      { name: 'Owners', description: 'Store owner management endpoints' },
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'Affiliations', description: 'Affiliate management endpoints' },
      { name: 'Superadmin', description: 'Superadmin management endpoints' },
      { name: 'Subscriptions', description: 'Subscription management endpoints' },
      { name: 'Subscription Plans', description: 'Subscription plan management endpoints' },
      { name: 'Store Info', description: 'Store information extraction endpoints' },
      { name: 'Subscription Renewal', description: 'Automatic subscription renewal endpoints' },
      { name: 'Health', description: 'Health check endpoints' }
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
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
  console.log(`🔄 Auto-restart enabled with nodemon`);
  console.log(`📊 Swagger docs: http://localhost:${PORT}/api-docs`);
  
  // Start subscription cron job
  const SubscriptionService = require('./services/SubscriptionService');
  SubscriptionService.startCronJob();
  
  // Start subscription renewal service
  const SubscriptionRenewalService = require('./services/SubscriptionRenewalService');
  SubscriptionRenewalService.startMonthlyCronJob();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  server.close(() => {
    console.log('✅ Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    console.log('✅ Server closed due to unhandled rejection');
    process.exit(1);
  });
});

module.exports = app; 