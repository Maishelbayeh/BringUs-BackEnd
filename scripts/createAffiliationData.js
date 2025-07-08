const mongoose = require('mongoose');
const Affiliation = require('../Models/Affiliation');
const AffiliatePayment = require('../Models/AffiliatePayment');
const Store = require('../Models/Store');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
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
    const adminUser = adminUsers.length > 0 ? adminUsers[0]._id : null;
    
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
        
        // Generate payments for this affiliate
        const payments = generatePayments(createdAffiliate, store._id, adminUser);
        paymentData.push(...payments);
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
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
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
      
      const payment = {
        store: storeId,
        affiliate: affiliate._id,
        amount,
        paymentMethod,
        paymentStatus,
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
          beneficiaryName: affiliate.fullName
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