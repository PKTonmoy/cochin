const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');

// Connect to MongoDB
const connectDB = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log(`URI: ${process.env.MONGODB_URI ? 'Defined' : 'Undefined'}`);
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

    // Additional check for models directory
    if (!fs.existsSync(modelsDir)) {
        console.error(`❌ Models directory not found at: ${modelsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(modelsDir);
    console.log(`📂 Found ${files.length} files in models directory.`);

    console.log('⚠️  Starting database wipe (FORCE MODE)...');

    for (const file of files) {
        if (file === 'index.js' || !file.endsWith('.js')) continue;

        const modelName = file.replace('.js', '');

        try {
            const Model = require(path.join(modelsDir, file));

            // Check if Model is valid
            if (!Model || !Model.deleteMany) {
                console.warn(`⚠️  Skipping ${modelName}: Not a valid Mongoose model.`);
                continue;
            }

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

// Execute immediately without prompt
wipeData();
