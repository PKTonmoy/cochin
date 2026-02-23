const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const { cleanupOldNotifications } = require('./src/services/cronJobs');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        // Check if old unread notification remains
        const count = await Notification.countDocuments({ createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        console.log('Old notifications before cleanup:', count);
        
        // Run cleanup
        await cleanupOldNotifications();
        
        // Check if it was deleted
        const countAfter = await Notification.countDocuments({ createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        console.log('Old notifications after cleanup:', countAfter);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
