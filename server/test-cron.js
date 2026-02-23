const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const { cleanupOldNotifications } = require('./src/services/cronJobs');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        // Create an old notification that is unread
        const thirtyOneDaysAgo = new Date();
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
        
        const oldNotification = await Notification.create({
            recipientType: 'all',
            type: 'general',
            title: 'Very Old Notice',
            message: 'This should be deleted',
            isRead: false,
            createdAt: thirtyOneDaysAgo
        });
        console.log('Created old unread notification:', oldNotification._id);
        
        // Run cleanup
        await cleanupOldNotifications();
        
        // Check if it was deleted
        const stillExists = await Notification.findById(oldNotification._id);
        console.log('Notification still exists?', !!stillExists);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
