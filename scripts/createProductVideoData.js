/**
 * Create Product Video Data Script
 * Creates sample products with video URLs for testing
 */

const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');
const Store = require('../Models/Store');

// Sample video URLs for different platforms
const sampleVideoUrls = {
  youtube: [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=9bZkp7q19f0",
    "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/9bZkp7q19f0"
  ],
  facebook: [
    "https://www.facebook.com/username/videos/123456789",
    "https://www.facebook.com/username/videos/987654321",
    "https://www.facebook.com/username/videos/456789123"
  ],
  instagram: [
    "https://www.instagram.com/p/ABC123xyz/",
    "https://www.instagram.com/p/DEF456uvw/",
    "https://www.instagram.com/reel/GHI789rst/"
  ],
  tiktok: [
    "https://www.tiktok.com/@username/video/123456789",
    "https://www.tiktok.com/@username/video/987654321",
    "https://www.tiktok.com/@username/video/456789123"
  ],
  twitter: [
    "https://twitter.com/username/status/123456789",
    "https://x.com/username/status/987654321",
    "https://twitter.com/username/status/456789123"
  ]
};

// Sample product data with videos
const sampleProductsWithVideos = [
  {
    nameAr: "هاتف ذكي مع فيديو يوتيوب",
    nameEn: "Smartphone with YouTube Video",
    descriptionAr: "هاتف ذكي حديث مع فيديو تعريفي من يوتيوب يوضح المميزات والاستخدامات",
    descriptionEn: "Modern smartphone with YouTube video showcasing features and usage",
    price: 999.99,
    availableQuantity: 50,
    stock: 50,
    videoUrl: sampleVideoUrls.youtube[0],
    mainImage: "https://example.com/smartphone.jpg",
    images: [
      "https://example.com/smartphone1.jpg",
      "https://example.com/smartphone2.jpg",
      "https://example.com/smartphone3.jpg"
    ],
    compareAtPrice: 1299.99,
    costPrice: 800.00,
    productOrder: 1,
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    rating: 4.5,
    numReviews: 25,
    views: 150,
    soldCount: 30,
    weight: 180,
    dimensions: {
      length: 15,
      width: 7.5,
      height: 0.8
    },
    seo: {
      title: "Smartphone with Video - Best Features",
      description: "Discover the latest smartphone with detailed video review",
      keywords: ["smartphone", "mobile", "video", "review"]
    }
  },
  {
    nameAr: "لابتوب مع فيديو فيسبوك",
    nameEn: "Laptop with Facebook Video",
    descriptionAr: "لابتوب قوي مع فيديو من فيسبوك يوضح الأداء والسرعة",
    descriptionEn: "Powerful laptop with Facebook video demonstrating performance and speed",
    price: 1499.99,
    availableQuantity: 30,
    stock: 30,
    videoUrl: sampleVideoUrls.facebook[0],
    mainImage: "https://example.com/laptop.jpg",
    images: [
      "https://example.com/laptop1.jpg",
      "https://example.com/laptop2.jpg"
    ],
    compareAtPrice: 1799.99,
    costPrice: 1200.00,
    productOrder: 2,
    visibility: true,
    isActive: true,
    isFeatured: false,
    isOnSale: true,
    salePercentage: 15,
    rating: 4.8,
    numReviews: 42,
    views: 200,
    soldCount: 18,
    weight: 2500,
    dimensions: {
      length: 35,
      width: 24,
      height: 2
    },
    seo: {
      title: "High Performance Laptop - Facebook Video Review",
      description: "See this laptop in action with our Facebook video review",
      keywords: ["laptop", "computer", "performance", "facebook video"]
    }
  },
  {
    nameAr: "سماعات مع فيديو انستغرام",
    nameEn: "Headphones with Instagram Video",
    descriptionAr: "سماعات عالية الجودة مع فيديو من انستغرام يوضح جودة الصوت",
    descriptionEn: "High-quality headphones with Instagram video showing sound quality",
    price: 299.99,
    availableQuantity: 75,
    stock: 75,
    videoUrl: sampleVideoUrls.instagram[0],
    mainImage: "https://example.com/headphones.jpg",
    images: [
      "https://example.com/headphones1.jpg",
      "https://example.com/headphones2.jpg",
      "https://example.com/headphones3.jpg",
      "https://example.com/headphones4.jpg"
    ],
    compareAtPrice: 399.99,
    costPrice: 200.00,
    productOrder: 3,
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    rating: 4.6,
    numReviews: 38,
    views: 120,
    soldCount: 45,
    weight: 350,
    dimensions: {
      length: 20,
      width: 18,
      height: 8
    },
    seo: {
      title: "Premium Headphones - Instagram Video Demo",
      description: "Experience premium sound quality with our Instagram video demo",
      keywords: ["headphones", "audio", "sound", "instagram video"]
    }
  },
  {
    nameAr: "ساعة ذكية مع فيديو تيك توك",
    nameEn: "Smartwatch with TikTok Video",
    descriptionAr: "ساعة ذكية متطورة مع فيديو من تيك توك يوضح المميزات",
    descriptionEn: "Advanced smartwatch with TikTok video showcasing features",
    price: 399.99,
    availableQuantity: 40,
    stock: 40,
    videoUrl: sampleVideoUrls.tiktok[0],
    mainImage: "https://example.com/smartwatch.jpg",
    images: [
      "https://example.com/smartwatch1.jpg",
      "https://example.com/smartwatch2.jpg"
    ],
    compareAtPrice: 499.99,
    costPrice: 300.00,
    productOrder: 4,
    visibility: true,
    isActive: true,
    isFeatured: false,
    isOnSale: true,
    salePercentage: 20,
    rating: 4.7,
    numReviews: 29,
    views: 180,
    soldCount: 22,
    weight: 50,
    dimensions: {
      length: 4.5,
      width: 4.5,
      height: 1.2
    },
    seo: {
      title: "Smartwatch Features - TikTok Video Showcase",
      description: "Watch our TikTok video to see all smartwatch features in action",
      keywords: ["smartwatch", "wearable", "fitness", "tiktok video"]
    }
  },
  {
    nameAr: "كاميرا مع فيديو تويتر",
    nameEn: "Camera with Twitter Video",
    descriptionAr: "كاميرا احترافية مع فيديو من تويتر يوضح جودة التصوير",
    descriptionEn: "Professional camera with Twitter video demonstrating photo quality",
    price: 899.99,
    availableQuantity: 25,
    stock: 25,
    videoUrl: sampleVideoUrls.twitter[0],
    mainImage: "https://example.com/camera.jpg",
    images: [
      "https://example.com/camera1.jpg",
      "https://example.com/camera2.jpg",
      "https://example.com/camera3.jpg"
    ],
    compareAtPrice: 1099.99,
    costPrice: 700.00,
    productOrder: 5,
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    rating: 4.9,
    numReviews: 15,
    views: 90,
    soldCount: 8,
    weight: 800,
    dimensions: {
      length: 14,
      width: 10,
      height: 8
    },
    seo: {
      title: "Professional Camera - Twitter Video Review",
      description: "See photo quality examples in our Twitter video review",
      keywords: ["camera", "photography", "professional", "twitter video"]
    }
  }
];

// Function to create products with videos
const createProductsWithVideos = async (storeId) => {
  try {
    console.log('🔍 Starting to create products with videos...');
    
    // Get first category and unit for the store
    const category = await Category.findOne({ store: storeId });
    const unit = await Unit.findOne({ store: storeId });
    
    if (!category) {
      throw new Error('No category found for store');
    }
    
    if (!unit) {
      throw new Error('No unit found for store');
    }
    
    console.log('🔍 Using category:', category.nameEn);
    console.log('🔍 Using unit:', unit.nameEn);
    
    const createdProducts = [];
    
    for (let i = 0; i < sampleProductsWithVideos.length; i++) {
      const productData = {
        ...sampleProductsWithVideos[i],
        category: category._id,
        categories: [category._id],
        unit: unit._id,
        store: storeId,
        productLabels: [],
        colors: '[]',
        attributes: [],
        specifications: [],
        tags: [],
        barcodes: [`VIDEO-${Date.now()}-${i + 1}`],
        specificationValues: [],
        lowStockThreshold: 5
      };
      
      console.log(`🔍 Creating product ${i + 1}: ${productData.nameEn}`);
      console.log(`🔍 Video URL: ${productData.videoUrl}`);
      
      const product = new Product(productData);
      await product.save();
      
      // Populate the product
      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'nameAr nameEn')
        .populate('categories', 'nameAr nameEn')
        .populate('unit', 'nameAr nameEn symbol')
        .populate('store', 'name domain');
      
      createdProducts.push(populatedProduct);
      
      console.log(`✅ Product created successfully: ${populatedProduct.nameEn}`);
      console.log(`✅ Video platform: ${populatedProduct.videoPlatform}`);
      console.log(`✅ Video ID: ${populatedProduct.videoId}`);
      console.log(`✅ Embed URL: ${populatedProduct.videoEmbedUrl}`);
      console.log('---');
    }
    
    console.log(`🎉 Successfully created ${createdProducts.length} products with videos`);
    
    return createdProducts;
    
  } catch (error) {
    console.error('❌ Error creating products with videos:', error);
    throw error;
  }
};

// Function to create variants with videos
const createVariantsWithVideos = async (productId, storeId) => {
  try {
    console.log('🔍 Creating variants with videos for product:', productId);
    
    const parentProduct = await Product.findById(productId);
    if (!parentProduct) {
      throw new Error('Parent product not found');
    }
    
    const variantData = [
      {
        nameAr: "متغير مع فيديو يوتيوب",
        nameEn: "Variant with YouTube Video",
        price: 1099.99,
        availableQuantity: 20,
        stock: 20,
        videoUrl: sampleVideoUrls.youtube[1],
        mainImage: "https://example.com/variant1.jpg",
        images: ["https://example.com/variant1-1.jpg", "https://example.com/variant1-2.jpg"]
      },
      {
        nameAr: "متغير مع فيديو فيسبوك",
        nameEn: "Variant with Facebook Video",
        price: 1199.99,
        availableQuantity: 15,
        stock: 15,
        videoUrl: sampleVideoUrls.facebook[1],
        mainImage: "https://example.com/variant2.jpg",
        images: ["https://example.com/variant2-1.jpg"]
      }
    ];
    
    const createdVariants = [];
    
    for (const variantInfo of variantData) {
      const variant = new Product({
        ...variantInfo,
        store: storeId,
        category: parentProduct.category,
        categories: [parentProduct.category],
        unit: parentProduct.unit,
        hasVariants: false,
        variants: [],
        isParent: false,
        productLabels: [],
        colors: '[]',
        attributes: [],
        specifications: [],
        tags: [],
        barcodes: [`VARIANT-VIDEO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`],
        specificationValues: [],
        lowStockThreshold: 5
      });
      
      await variant.save();
      
      // Add variant to parent
      await Product.findByIdAndUpdate(productId, {
        $push: { variants: variant._id },
        $set: { hasVariants: true, isParent: true }
      });
      
      const populatedVariant = await Product.findById(variant._id)
        .populate('category', 'nameAr nameEn')
        .populate('categories', 'nameAr nameEn')
        .populate('unit', 'nameAr nameEn symbol')
        .populate('store', 'name domain');
      
      createdVariants.push(populatedVariant);
      
      console.log(`✅ Variant created: ${populatedVariant.nameEn}`);
      console.log(`✅ Video platform: ${populatedVariant.videoPlatform}`);
      console.log(`✅ Video ID: ${populatedVariant.videoId}`);
    }
    
    console.log(`🎉 Successfully created ${createdVariants.length} variants with videos`);
    
    return createdVariants;
    
  } catch (error) {
    console.error('❌ Error creating variants with videos:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');
    
    // Get store ID from command line argument or use default
    const storeId = process.argv[2];
    if (!storeId) {
      console.log('❌ Please provide a store ID as argument');
      console.log('Usage: node createProductVideoData.js <storeId>');
      process.exit(1);
    }
    
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.log('❌ Store not found');
      process.exit(1);
    }
    
    console.log(`🔍 Creating products with videos for store: ${store.name}`);
    
    // Create products with videos
    const products = await createProductsWithVideos(storeId);
    
    // Create variants for the first product
    if (products.length > 0) {
      await createVariantsWithVideos(products[0]._id, storeId);
    }
    
    console.log('🎉 All products with videos created successfully!');
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
};

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createProductsWithVideos,
  createVariantsWithVideos,
  sampleVideoUrls,
  sampleProductsWithVideos
};
