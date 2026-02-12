require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const wipeData = async () => {
    await connectDB();

    const modelsDir = path.join(__dirname, '../models');
    const files = fs.readdirSync(modelsDir);

    console.log('⚠️  Starting database wipe...');

    for (const file of files) {
        if (file === 'index.js' || !file.endsWith('.js')) continue;

        const modelName = file.replace('.js', '');
        const Model = require(path.join(modelsDir, file));

        try {
            if (modelName === 'User') {
                // For User model, keep admins
                const result = await Model.deleteMany({ role: { $ne: 'admin' } });
                console.log(`✅ Cleared ${result.deletedCount} non-admin users from ${modelName}`);

                // Log remaining admins
                const admins = await Model.find({ role: 'admin' });
                console.log(`ℹ️  ${admins.length} admin(s) preserved: ${admins.map(a => a.email).join(', ')}`);
            } else {
                // For all other models, delete everything
                const result = await Model.deleteMany({});
                console.log(`✅ Cleared ${result.deletedCount} documents from ${modelName}`);
            }
        } catch (error) {
            console.error(`❌ Error clearing ${modelName}:`, error.message);
        }
    }

    console.log('🎉 Database wipe complete!');
    process.exit(0);
};

// Prompt for confirmation
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  WARNING: This will delete ALL data except Admin users.');
rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
        wipeData();
    } else {
        console.log('🚫 Operation cancelled.');
        process.exit(0);
    }
    rl.close();
});
