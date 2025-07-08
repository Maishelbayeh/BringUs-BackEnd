const mongoose = require('mongoose');
const Advertisement = require('../Models/Advertisement');
const Store = require('../Models/Store');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const storeId = '686a719956a82bfcc93a2e2d';

const advertisementData = [
  {
    title: 'عرض خاص رمضان',
    description: 'خصومات تصل إلى 50% على جميع المنتجات',
    htmlContent: `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Arial', sans-serif;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">
          🎉 عرض خاص رمضان 🎉
        </h2>
        <p style="margin: 0 0 15px 0; font-size: 16px;">
          خصومات تصل إلى 50% على جميع المنتجات
        </p>
        <button style="
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='#ff5252'" onmouseout="this.style.background='#ff6b6b'">
          تسوق الآن
        </button>
      </div>
    `,
    position: 'top',
    isActive: true,
    priority: 5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    title: 'عرض الصيف',
    description: 'أفضل الأسعار على الأجهزة الإلكترونية',
    htmlContent: `
      <div style="
        background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
        color: #333;
        padding: 25px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(255,154,158,0.3);
        font-family: 'Arial', sans-serif;
        border: 2px solid #ff9a9e;
      ">
        <div style="font-size: 32px; margin-bottom: 10px;">☀️</div>
        <h3 style="margin: 0 0 15px 0; font-size: 22px; color: #d63384;">
          عرض الصيف الحار
        </h3>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">
          أفضل الأسعار على الأجهزة الإلكترونية
        </p>
        <div style="
          background: rgba(255,255,255,0.9);
          padding: 15px;
          border-radius: 10px;
          margin: 15px 0;
        ">
          <span style="font-size: 28px; font-weight: bold; color: #d63384;">30%</span>
          <span style="font-size: 18px; margin-left: 10px;">خصم</span>
        </div>
        <button style="
          background: #d63384;
          color: white;
          border: none;
          padding: 15px 35px;
          border-radius: 30px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='#b02a37'" onmouseout="this.style.background='#d63384'">
          احصل على العرض
        </button>
      </div>
    `,
    position: 'banner',
    isActive: false,
    priority: 3,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  },
  {
    title: 'عرض العودة للمدارس',
    description: 'أقلام ودفاتر بأسعار منافسة',
    htmlContent: `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 6px 20px rgba(102,126,234,0.4);
        font-family: 'Arial', sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff6b6b;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        ">
          جديد
        </div>
        <div style="font-size: 36px; margin-bottom: 10px;">📚</div>
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">
          عرض العودة للمدارس
        </h3>
        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
          أقلام ودفاتر بأسعار منافسة
        </p>
        <div style="
          background: rgba(255,255,255,0.2);
          padding: 10px;
          border-radius: 8px;
          margin: 10px 0;
        ">
          <span style="font-size: 24px; font-weight: bold;">25%</span>
          <span style="font-size: 14px; margin-left: 8px;">خصم</span>
        </div>
        <button style="
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='#ff5252'" onmouseout="this.style.background='#ff6b6b'">
          تسوق الآن
        </button>
      </div>
    `,
    position: 'sidebar',
    isActive: false,
    priority: 2,
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
  }
];

async function createAdvertisementData() {
  try {
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error('Store not found');
      return;
    }

    // Clear existing advertisements for this store
    await Advertisement.deleteMany({ store: storeId });
    console.log('Cleared existing advertisements');

    // Create new advertisements
    for (const adData of advertisementData) {
      const advertisement = new Advertisement({
        ...adData,
        store: storeId
      });
      
      await advertisement.save();
      console.log(`Created advertisement: ${adData.title}`);
    }

    console.log('Advertisement data created successfully!');
    
    // Display created advertisements
    const advertisements = await Advertisement.find({ store: storeId });
    console.log('\nCreated advertisements:');
    advertisements.forEach(ad => {
      console.log(`- ${ad.title} (${ad.isActive ? 'Active' : 'Inactive'}) - Position: ${ad.position}`);
    });

  } catch (error) {
    console.error('Error creating advertisement data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdvertisementData(); 