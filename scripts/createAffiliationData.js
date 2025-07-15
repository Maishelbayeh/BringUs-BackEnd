const mongoose = require('mongoose');
const Affiliation = require('../Models/Affiliation');
const AffiliatePayment = require('../Models/AffiliatePayment');
const Store = require('../Models/Store');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing affiliation data
    await Affiliation.deleteMany({});
    await AffiliatePayment.deleteMany({});
    console.log('Cleared existing affiliation data');
    
    // Get stores
    const stores = await Store.find({});
    if (stores.length === 0) {
      console.log('No stores found. Please create stores first.');
      process.exit(1);
    }
    
    // Get admin users for verification and payment processing
    const adminUsers = await User.find({ role: 'admin' });
    let adminUser = adminUsers.length > 0 ? adminUsers[0]._id : null;
    
    // If no admin user found, try to find any user or create a fallback
    if (!adminUser) {
      const anyUser = await User.findOne();
      if (anyUser) {
        adminUser = anyUser._id;
        console.log('Using fallback user for admin operations:', anyUser.email);
      } else {
        console.log('Warning: No users found. Payment creation may fail.');
      }
    }
    
    console.log(`Found ${stores.length} stores`);
    
    // Create affiliation data for each store
    for (const store of stores) {
      console.log(`\nCreating affiliation data for store: ${store.name}`);
      
      const affiliationData = [];
      const paymentData = [];
      
      // Generate realistic affiliate data based on store type
      const affiliates = generateAffiliates(store.name, store._id, adminUser);
      
      for (const affiliate of affiliates) {
        // Create affiliate
        const createdAffiliate = await Affiliation.create(affiliate);
        affiliationData.push(createdAffiliate);
        
              // Generate payments for this affiliate (only if adminUser exists)
      if (adminUser) {
        const payments = generatePayments(createdAffiliate, store._id, adminUser);
        paymentData.push(...payments);
      } else {
        console.log('Skipping payment creation for affiliate due to missing admin user');
      }
      }
      
      // Insert payments
      if (paymentData.length > 0) {
        await AffiliatePayment.insertMany(paymentData);
      }
      
      console.log(`Created ${affiliationData.length} affiliates and ${paymentData.length} payments for ${store.name}`);
    }
    
    // Display summary
    const totalAffiliates = await Affiliation.countDocuments();
    const totalPayments = await AffiliatePayment.countDocuments();
    
    const stats = await Affiliation.aggregate([
      {
        $group: {
          _id: null,
          totalAffiliates: { $sum: 1 },
          activeAffiliates: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          totalSales: { $sum: '$totalSales' },
          totalCommission: { $sum: '$totalCommission' },
          totalPaid: { $sum: '$totalPaid' },
          totalBalance: { $sum: '$balance' },
          totalOrders: { $sum: '$totalOrders' },
          totalCustomers: { $sum: '$totalCustomers' },
          averageCommission: { $avg: '$percent' }
        }
      }
    ]);
    
    const paymentStats = await AffiliatePayment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] }
          }
        }
      }
    ]);
    
    console.log('\n=== Affiliation Data Creation Summary ===');
    console.log(`Total affiliates created: ${totalAffiliates}`);
    console.log(`Total payments created: ${totalPayments}`);
    
    if (stats.length > 0) {
      const affiliateStats = stats[0];
      console.log('\nAffiliate Statistics:');
      console.log(`Total affiliates: ${affiliateStats.totalAffiliates}`);
      console.log(`Active affiliates: ${affiliateStats.activeAffiliates}`);
      console.log(`Total sales: $${affiliateStats.totalSales.toFixed(2)}`);
      console.log(`Total commission: $${affiliateStats.totalCommission.toFixed(2)}`);
      console.log(`Total paid: $${affiliateStats.totalPaid.toFixed(2)}`);
      console.log(`Total balance: $${affiliateStats.totalBalance.toFixed(2)}`);
      console.log(`Total orders: ${affiliateStats.totalOrders}`);
      console.log(`Total customers: ${affiliateStats.totalCustomers}`);
      console.log(`Average commission: ${affiliateStats.averageCommission.toFixed(1)}%`);
    }
    
    if (paymentStats.length > 0) {
      const payStats = paymentStats[0];
      console.log('\nPayment Statistics:');
      console.log(`Total payments: ${payStats.totalPayments}`);
      console.log(`Total amount: $${payStats.totalAmount.toFixed(2)}`);
      console.log(`Completed payments: ${payStats.completedPayments}`);
      console.log(`Completed amount: $${payStats.completedAmount.toFixed(2)}`);
      console.log(`Pending payments: ${payStats.pendingPayments}`);
      console.log(`Pending amount: $${payStats.pendingAmount.toFixed(2)}`);
    }
    
    // Show sample data
    console.log('\n=== Sample Affiliation Data ===');
    const sampleAffiliate = await Affiliation.findOne()
      .populate('store', 'name domain')
      .populate('verifiedBy', 'firstName lastName');
    
    if (sampleAffiliate) {
      console.log('Sample Affiliate:');
      console.log(`Name: ${sampleAffiliate.fullName}`);
      console.log(`Email: ${sampleAffiliate.email}`);
      console.log(`Store: ${sampleAffiliate.store.name}`);
      console.log(`Commission: ${sampleAffiliate.commissionRate}`);
      console.log(`Status: ${sampleAffiliate.status}`);
      console.log(`Total Sales: $${sampleAffiliate.totalSales.toFixed(2)}`);
      console.log(`Total Commission: $${sampleAffiliate.totalCommission.toFixed(2)}`);
      console.log(`Balance: $${sampleAffiliate.balance.toFixed(2)}`);
      console.log(`Affiliate Code: ${sampleAffiliate.affiliateCode}`);
      console.log(`Affiliate Link: ${sampleAffiliate.affiliateLink}`);
      console.log(`Is Verified: ${sampleAffiliate.isVerified}`);
      console.log(`Performance Score: ${sampleAffiliate.performanceScore}`);
    }
    
    console.log('\n✅ Affiliation data created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the API endpoints using the CURL commands');
    console.log('2. Check affiliate statistics and analytics');
    console.log('3. Test payment processing');
    console.log('4. Verify store isolation');
    console.log('5. Test affiliate verification flow');
    
  } catch (error) {
    console.error('Error creating affiliation data:', error);
  }
});

// Generate realistic affiliate data based on store type
function generateAffiliates(storeName, storeId, adminUser) {
  const isTechStore = storeName.toLowerCase().includes('tech');
  const isFashionStore = storeName.toLowerCase().includes('fashion');
  
  const affiliates = [];
  const numAffiliates = Math.floor(Math.random() * 8) + 3; // 3-10 affiliates per store
  
  const firstNames = ['Omar', 'Lina', 'Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Khalil', 'Nour', 'Youssef', 'Hana'];
  const lastNames = ['Khaled', 'Samir', 'Hassan', 'Ali', 'Mahmoud', 'Saleh', 'Abu', 'Rashid', 'Zaid', 'Omar'];
  const cities = ['Hebron', 'Jenin', 'Nablus', 'Ramallah', 'Bethlehem', 'Tulkarm', 'Qalqilya', 'Salfit', 'Tubas', 'Jericho'];
  
  for (let i = 0; i < numAffiliates; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    // Generate commission based on store type
    let percent;
    if (isTechStore) {
      percent = Math.floor(Math.random() * 8) + 5; // 5-12% for tech
    } else if (isFashionStore) {
      percent = Math.floor(Math.random() * 10) + 8; // 8-17% for fashion
    } else {
      percent = Math.floor(Math.random() * 6) + 6; // 6-11% for general
    }
    
    // Generate performance data
    const totalSales = Math.floor(Math.random() * 50000) + 1000;
    const totalOrders = Math.floor(Math.random() * 500) + 10;
    const totalCustomers = Math.floor(Math.random() * 300) + 5;
    const totalCommission = (totalSales * percent) / 100;
    const totalPaid = Math.floor(Math.random() * totalCommission * 0.8);
    const balance = totalCommission - totalPaid;
    
    // Determine status
    const statusOptions = ['Active', 'Active', 'Active', 'Pending', 'Inactive'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Determine if verified
    const isVerified = status === 'Active' && Math.random() > 0.2; // 80% of active affiliates are verified
    
    // Generate affiliate code
    const affiliateCode = generateAffiliateCode();
    const affiliateLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ref/${affiliateCode}`;
    
    const affiliate = {
      store: storeId,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`,
      password: 'password123', // Will be hashed by the model
      mobile: `+970${Math.floor(Math.random() * 90000000) + 10000000}`,
      address: `${city}, Palestine`,
      percent,
      status,
      affiliateCode,
      affiliateLink,
      totalSales,
      totalOrders,
      totalCustomers,
      totalCommission,
      totalPaid,
      balance,
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      bankInfo: {
        bankName: 'Bank of Palestine',
        accountNumber: Math.floor(Math.random() * 9000000000) + 1000000000,
        iban: `PS12PALS${Math.floor(Math.random() * 90000000000000000000000000) + 10000000000000000000000000}`,
        swiftCode: 'PALSPS22'
      },
      settings: {
        autoPayment: Math.random() > 0.5,
        paymentThreshold: Math.floor(Math.random() * 200) + 50,
        paymentMethod: ['bank_transfer', 'paypal', 'cash', 'check'][Math.floor(Math.random() * 4)],
        notifications: {
          email: true,
          sms: Math.random() > 0.5
        }
      },
      notes: `Affiliate partner from ${city}`,
      isVerified,
      verificationDate: isVerified ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      verifiedBy: isVerified ? adminUser : null
    };
    
    affiliates.push(affiliate);
  }
  
  return affiliates;
}

// Generate realistic payment data for an affiliate
function generatePayments(affiliate, storeId, adminUser) {
  const payments = [];
  const numPayments = Math.floor(Math.random() * 5) + 1; // 1-5 payments per affiliate
  
  const paymentMethods = ['bank_transfer', 'paypal', 'cash', 'check'];
  const paymentStatuses = ['completed', 'completed', 'completed', 'pending', 'processing'];
  
  let remainingBalance = affiliate.balance;
  
  for (let i = 0; i < numPayments; i++) {
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    // Calculate payment amount (don't exceed remaining balance)
    const maxAmount = Math.min(remainingBalance, Math.floor(Math.random() * 1000) + 100);
    const amount = maxAmount > 0 ? maxAmount : 0;
    
    if (amount > 0) {
      const paymentDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
      
      // Generate unique reference
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const reference = `PAY-${timestamp}-${random}-${i}`;
      
      const payment = {
        store: storeId,
        affiliate: affiliate._id,
        amount,
        paymentMethod,
        paymentStatus,
        reference,
        paymentDate,
        processedDate: paymentStatus === 'completed' ? paymentDate : null,
        previousBalance: remainingBalance,
        newBalance: remainingBalance - amount,
        description: `${paymentMethod.replace('_', ' ')} payment`,
        notes: `Payment for ${paymentDate.toLocaleDateString()}`,
        processedBy: adminUser,
        bankTransfer: paymentMethod === 'bank_transfer' ? {
          bankName: affiliate.bankInfo.bankName,
          accountNumber: affiliate.bankInfo.accountNumber,
          iban: affiliate.bankInfo.iban,
          swiftCode: affiliate.bankInfo.swiftCode,
          beneficiaryName: `${affiliate.firstName} ${affiliate.lastName}`
        } : undefined,
        paypal: paymentMethod === 'paypal' ? {
          paypalEmail: `${affiliate.firstName.toLowerCase()}@paypal.com`,
          paypalTransactionId: `TXN${Math.floor(Math.random() * 900000000) + 100000000}`
        } : undefined,
        auditTrail: [
          {
            action: 'created',
            performedBy: adminUser,
            notes: 'Payment created'
          }
        ]
      };
      
      if (paymentStatus === 'completed') {
        payment.auditTrail.push({
          action: 'completed',
          performedBy: adminUser,
          notes: 'Payment completed successfully'
        });
      }
      
      payments.push(payment);
      remainingBalance -= amount;
    }
  }
  
  return payments;
}

// Generate unique affiliate code
const generateAffiliateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique affiliate code for database
const generateUniqueAffiliateCode = async () => {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = generateAffiliateCode();
    const existing = await Affiliation.findOne({ affiliateCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

// Sample affiliate data
const affiliateData = [
  {
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed.mohamed@example.com',
    password: 'password123',
    mobile: '+970599123456',
    address: 'الخليل، فلسطين',
    percent: 8,
    status: 'Active',
    totalSales: 15000,
    totalCommission: 1200,
    totalPaid: 800,
    balance: 400,
    totalOrders: 45,
    totalCustomers: 38,
    conversionRate: 84.4,
    bankInfo: {
      bankName: 'بنك فلسطين',
      accountNumber: '1234567890',
      iban: 'PS12PALS123456789012345678901',
      swiftCode: 'PALSPS22'
    },
    settings: {
      autoPayment: false,
      paymentThreshold: 100,
      paymentMethod: 'bank_transfer',
      notifications: {
        email: true,
        sms: false
      }
    },
    notes: 'شريك ممتاز، أداء عالي'
  },
  {
    firstName: 'فاطمة',
    lastName: 'علي',
    email: 'fatima.ali@example.com',
    password: 'password123',
    mobile: '+970599234567',
    address: 'رام الله، فلسطين',
    percent: 10,
    status: 'Active',
    totalSales: 22000,
    totalCommission: 2200,
    totalPaid: 1500,
    balance: 700,
    totalOrders: 67,
    totalCustomers: 52,
    conversionRate: 77.6,
    bankInfo: {
      bankName: 'البنك العربي',
      accountNumber: '0987654321',
      iban: 'PS12ARAB098765432109876543210',
      swiftCode: 'ARABPS22'
    },
    settings: {
      autoPayment: true,
      paymentThreshold: 200,
      paymentMethod: 'paypal',
      notifications: {
        email: true,
        sms: true
      }
    },
    notes: 'شريكة نشطة، تفضل الدفع عبر PayPal'
  },
  {
    firstName: 'عمر',
    lastName: 'خالد',
    email: 'omar.khaled@example.com',
    password: 'password123',
    mobile: '+970599345678',
    address: 'نابلس، فلسطين',
    percent: 7,
    status: 'Active',
    totalSales: 8500,
    totalCommission: 595,
    totalPaid: 400,
    balance: 195,
    totalOrders: 28,
    totalCustomers: 25,
    conversionRate: 89.3,
    bankInfo: {
      bankName: 'بنك القدس',
      accountNumber: '1122334455',
      iban: 'PS12QUDS112233445511223344550',
      swiftCode: 'QUDSPS22'
    },
    settings: {
      autoPayment: false,
      paymentThreshold: 150,
      paymentMethod: 'bank_transfer',
      notifications: {
        email: true,
        sms: false
      }
    },
    notes: 'شريك جديد، أداء جيد'
  },
  {
    firstName: 'سارة',
    lastName: 'أحمد',
    email: 'sara.ahmed@example.com',
    password: 'password123',
    mobile: '+970599456789',
    address: 'بيت لحم، فلسطين',
    percent: 9,
    status: 'Active',
    totalSales: 18000,
    totalCommission: 1620,
    totalPaid: 1200,
    balance: 420,
    totalOrders: 54,
    totalCustomers: 47,
    conversionRate: 87.0,
    bankInfo: {
      bankName: 'بنك فلسطين',
      accountNumber: '5566778899',
      iban: 'PS12PALS556677889955667788990',
      swiftCode: 'PALSPS22'
    },
    settings: {
      autoPayment: true,
      paymentThreshold: 100,
      paymentMethod: 'bank_transfer',
      notifications: {
        email: true,
        sms: true
      }
    },
    notes: 'شريكة موثوقة، تفضل الدفع التلقائي'
  },
  {
    firstName: 'محمد',
    lastName: 'حسن',
    email: 'mohamed.hassan@example.com',
    password: 'password123',
    mobile: '+970599567890',
    address: 'أريحا، فلسطين',
    percent: 6,
    status: 'Pending',
    totalSales: 0,
    totalCommission: 0,
    totalPaid: 0,
    balance: 0,
    totalOrders: 0,
    totalCustomers: 0,
    conversionRate: 0,
    bankInfo: {
      bankName: 'البنك العربي',
      accountNumber: '9988776655',
      iban: 'PS12ARAB998877665599887766550',
      swiftCode: 'ARABPS22'
    },
    settings: {
      autoPayment: false,
      paymentThreshold: 100,
      paymentMethod: 'cash',
      notifications: {
        email: true,
        sms: false
      }
    },
    notes: 'شريك جديد، في انتظار التفعيل'
  },
  {
    firstName: 'ليلى',
    lastName: 'محمود',
    email: 'layla.mahmoud@example.com',
    password: 'password123',
    mobile: '+970599678901',
    address: 'طولكرم، فلسطين',
    percent: 8.5,
    status: 'Active',
    totalSales: 12500,
    totalCommission: 1062.5,
    totalPaid: 800,
    balance: 262.5,
    totalOrders: 38,
    totalCustomers: 32,
    conversionRate: 84.2,
    bankInfo: {
      bankName: 'بنك القدس',
      accountNumber: '4433221100',
      iban: 'PS12QUDS443322110044332211000',
      swiftCode: 'QUDSPS22'
    },
    settings: {
      autoPayment: false,
      paymentThreshold: 200,
      paymentMethod: 'bank_transfer',
      notifications: {
        email: true,
        sms: true
      }
    },
    notes: 'شريكة نشطة، تفضل الدفع عند الوصول للحد الأدنى'
  },
  {
    firstName: 'يوسف',
    lastName: 'إبراهيم',
    email: 'youssef.ibrahim@example.com',
    password: 'password123',
    mobile: '+970599789012',
    address: 'قلقيلية، فلسطين',
    percent: 7.5,
    status: 'Inactive',
    totalSales: 5000,
    totalCommission: 375,
    totalPaid: 375,
    balance: 0,
    totalOrders: 15,
    totalCustomers: 12,
    conversionRate: 80.0,
    bankInfo: {
      bankName: 'بنك فلسطين',
      accountNumber: '6677889900',
      iban: 'PS12PALS667788990066778899000',
      swiftCode: 'PALSPS22'
    },
    settings: {
      autoPayment: false,
      paymentThreshold: 100,
      paymentMethod: 'bank_transfer',
      notifications: {
        email: false,
        sms: false
      }
    },
    notes: 'شريك غير نشط، تم دفع جميع العمولات'
  },
  {
    firstName: 'نور',
    lastName: 'عبدالله',
    email: 'nour.abdullah@example.com',
    password: 'password123',
    mobile: '+970599890123',
    address: 'سلفيت، فلسطين',
    percent: 9.5,
    status: 'Active',
    totalSales: 28000,
    totalCommission: 2660,
    totalPaid: 2000,
    balance: 660,
    totalOrders: 89,
    totalCustomers: 76,
    conversionRate: 85.4,
    bankInfo: {
      bankName: 'البنك العربي',
      accountNumber: '7788990011',
      iban: 'PS12ARAB778899001177889900110',
      swiftCode: 'ARABPS22'
    },
    settings: {
      autoPayment: true,
      paymentThreshold: 150,
      paymentMethod: 'paypal',
      notifications: {
        email: true,
        sms: true
      }
    },
    notes: 'شريكة ممتازة، أعلى نسبة عمولة، أداء استثنائي'
  }
];

// Create affiliations for the store
const createAffiliationData = async () => {
  try {
    const storeId = '687505893fbf3098648bfe16';
    
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error('Store not found with ID:', storeId);
      return;
    }
    
    console.log('Creating affiliations for store:', store.name);
    
    // Check if affiliations already exist for this store
    const existingAffiliations = await Affiliation.find({ store: storeId });
    if (existingAffiliations.length > 0) {
      console.log(`Found ${existingAffiliations.length} existing affiliations for this store`);
      console.log('Skipping creation to avoid duplicates');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create affiliations
    const createdAffiliations = [];
    
    for (const data of affiliateData) {
      // Generate unique affiliate code
      const affiliateCode = await generateUniqueAffiliateCode();
      
      // Create affiliate link
      const affiliateLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ref/${affiliateCode}`;
      
      const affiliationData = {
        ...data,
        password: hashedPassword,
        affiliateCode,
        affiliateLink,
        store: storeId,
        isVerified: data.status === 'Active',
        verificationDate: data.status === 'Active' ? new Date() : null,
        lastActivity: new Date(),
        registrationDate: new Date()
      };
      
      const affiliation = await Affiliation.create(affiliationData);
      createdAffiliations.push(affiliation);
      
      console.log(`Created affiliation: ${affiliation.firstName} ${affiliation.lastName} (${affiliation.affiliateCode})`);
    }
    
    console.log(`\n✅ Successfully created ${createdAffiliations.length} affiliations for store: ${store.name}`);
    console.log('Store ID:', storeId);
    
    // Display summary
    const activeCount = createdAffiliations.filter(a => a.status === 'Active').length;
    const pendingCount = createdAffiliations.filter(a => a.status === 'Pending').length;
    const inactiveCount = createdAffiliations.filter(a => a.status === 'Inactive').length;
    
    console.log('\n📊 Summary:');
    console.log(`- Active: ${activeCount}`);
    console.log(`- Pending: ${pendingCount}`);
    console.log(`- Inactive: ${inactiveCount}`);
    console.log(`- Total: ${createdAffiliations.length}`);
    
  } catch (error) {
    console.error('Error creating affiliation data:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0');
    await createAffiliationData();
    console.log('\n🎉 Affiliation data creation completed!');
  } catch (error) {
    console.error('Error in main execution:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAffiliationData }; 