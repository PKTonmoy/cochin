#!/usr/bin/env node
/**
 * VAPID Key Generator
 * Run this once to generate VAPID keys for Web Push notifications.
 *
 * Usage:
 *   node src/scripts/generateVapidKeys.js
 *
 * Then copy the output into your .env file.
 */

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated Successfully!\n');
console.log('Add these to your server .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your-email@example.com`);
console.log('\nAdd this to your client .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret! Never expose it to the client.\n');
