/**
 * Reset Admin Script
 * Usage: node scripts/resetAdmin.js <email> <password> [name] [phone]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const resetAdmin = async () => {
    // Get arguments
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];
    const name = args[2] || 'Admin User';
    const phone = args[3] || '01700000000';

    if (!email || !password) {
        console.error('❌ Error: Please provide email and password.');
        console.log('Usage: node scripts/resetAdmin.js <email> <password> [name] [phone]');
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Delete existing admins
        const deleteResult = await User.deleteMany({ role: 'admin' });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin user(s).`);

        // Create new admin
        const newAdmin = await User.create({
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            name,
            phone,
            role: 'admin',
            isActive: true,
            mustChangePassword: false
        });

        console.log('✅ New Admin user created successfully!');
        console.log(`   Name: ${newAdmin.name}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetAdmin();
