const mongoose = require('mongoose');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
const STORE_ID = '687505893fbf3098648bfe16'; // Store ID المحدد

async function createCustomersData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`🏪 Using Store ID: ${STORE_ID}`);

    // Sample customers data
    const customersData = [
      {
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed.mohamed@example.com',
        password: 'password123',
        phone: '+201234567890',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع النيل 123',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11511',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'فاطمة',
        lastName: 'علي',
        email: 'fatima.ali@example.com',
        password: 'password123',
        phone: '+201234567891',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع المعادي 456',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11431',
            country: 'مصر',
            isDefault: true
          },
          {
            type: 'work',
            street: 'شارع التحرير 789',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11111',
            country: 'مصر',
            isDefault: false
          }
        ],
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'محمد',
        lastName: 'حسن',
        email: 'mohamed.hassan@example.com',
        password: 'password123',
        phone: '+201234567892',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع الزمالك 321',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11211',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: false,
        isActive: true
      },
      {
        firstName: 'سارة',
        lastName: 'أحمد',
        email: 'sara.ahmed@example.com',
        password: 'password123',
        phone: '+201234567893',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع مصر الجديدة 654',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11341',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'علي',
        lastName: 'محمد',
        email: 'ali.mohamed@example.com',
        password: 'password123',
        phone: '+201234567894',
        role: 'client',
        store: STORE_ID,
        status: 'inactive',
        addresses: [
          {
            type: 'home',
            street: 'شارع مدينة نصر 987',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11371',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: false
      },
      {
        firstName: 'نور',
        lastName: 'حسن',
        email: 'nour.hassan@example.com',
        password: 'password123',
        phone: '+201234567895',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع المعادي الجديد 147',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11432',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'يوسف',
        lastName: 'علي',
        email: 'youssef.ali@example.com',
        password: 'password123',
        phone: '+201234567896',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع الزمالك الجديد 258',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11212',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: false,
        isActive: true
      },
      {
        firstName: 'مريم',
        lastName: 'أحمد',
        email: 'mariam.ahmed@example.com',
        password: 'password123',
        phone: '+201234567897',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع مصر الجديدة الجديد 369',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11342',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'كريم',
        lastName: 'محمد',
        email: 'kareem.mohamed@example.com',
        password: 'password123',
        phone: '+201234567898',
        role: 'client',
        store: STORE_ID,
        status: 'banned',
        addresses: [
          {
            type: 'home',
            street: 'شارع مدينة نصر الجديد 741',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11372',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: false
      },
      {
        firstName: 'ليلى',
        lastName: 'حسن',
        email: 'layla.hassan@example.com',
        password: 'password123',
        phone: '+201234567899',
        role: 'client',
        store: STORE_ID,
        status: 'active',
        addresses: [
          {
            type: 'home',
            street: 'شارع المعادي القديم 852',
            city: 'القاهرة',
            state: 'القاهرة',
            zipCode: '11433',
            country: 'مصر',
            isDefault: true
          }
        ],
        isEmailVerified: true,
        isActive: true
      }
    ];

    // Clear existing customers for this store
    const deleteResult = await User.deleteMany({ store: STORE_ID, role: 'client' });
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing customers for store ${STORE_ID}`);

    // Hash passwords before creating users
    const customersWithHashedPasswords = await Promise.all(
      customersData.map(async (customer) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(customer.password, salt);
        return {
          ...customer,
          password: hashedPassword
        };
      })
    );

    // Insert new customers
    const customers = await User.insertMany(customersWithHashedPasswords);
    console.log(`✅ Created ${customers.length} customers for store ${STORE_ID}`);

    // Display created customers
    console.log('\n👥 Created Customers:');
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Status: ${customer.status}`);
      console.log(`   Email Verified: ${customer.isEmailVerified}`);
      console.log(`   Active: ${customer.isActive}`);
      console.log(`   Addresses: ${customer.addresses.length}`);
      console.log(`   ID: ${customer._id}`);
      console.log('');
    });

    console.log('\n🎉 Customers data created successfully!');
    console.log(`📊 Total customers in database for store ${STORE_ID}: ${customers.length}`);

    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const testCustomers = await User.find({ store: STORE_ID, role: 'client' }).populate('store');
    console.log(`✅ API test successful - Found ${testCustomers.length} customers`);

    // Display statistics
    const activeCustomers = await User.countDocuments({ store: STORE_ID, role: 'client', status: 'active' });
    const inactiveCustomers = await User.countDocuments({ store: STORE_ID, role: 'client', status: 'inactive' });
    const bannedCustomers = await User.countDocuments({ store: STORE_ID, role: 'client', status: 'banned' });
    const verifiedCustomers = await User.countDocuments({ store: STORE_ID, role: 'client', isEmailVerified: true });

    console.log('\n📈 Customer Statistics:');
    console.log(`   Active: ${activeCustomers}`);
    console.log(`   Inactive: ${inactiveCustomers}`);
    console.log(`   Banned: ${bannedCustomers}`);
    console.log(`   Email Verified: ${verifiedCustomers}`);

  } catch (error) {
    console.error('❌ Error creating customers data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createCustomersData(); 