/**
 * Marketing Module Seed Script
 * Seeds sample marketing data for SS English Lab
 * 
 * Usage: node server/src/scripts/seedMarketing.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import models
const MktSettings = require('../models/MktSettings');
const MktPopup = require('../models/MktPopup');
const MktOfferBanner = require('../models/MktOfferBanner');
const MktPromoSection = require('../models/MktPromoSection');
const MktQrVideo = require('../models/MktQrVideo');

const seedData = async () => {
    try {
        await connectDB();
        console.log('\n🌱 Seeding SS English Lab marketing data...\n');

        // --- 1. Marketing Settings (singleton) ---
        await MktSettings.deleteMany({});
        await MktSettings.create({
            marketingEnabled: true
        });
        console.log('✅ Marketing settings seeded');

        // --- 2. Pop-up Banners ---
        await MktPopup.deleteMany({});
        await MktPopup.insertMany([
            {
                title: '🎉 Admission Open for 2026!',
                content: 'Enroll now in our Spoken English & ICT courses. Limited seats available! Early bird discount of 20% for first 50 students.',
                ctaLabel: 'Enroll Now',
                ctaUrl: '/admission',
                displayFrequency: 'session',
                delaySeconds: 3,
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-06-30'),
                isActive: true
            },
            {
                title: '📢 Free IELTS Mock Test',
                content: 'Register for our FREE IELTS Mock Test this weekend! Get a detailed score analysis and personalized feedback from our expert faculty.',
                ctaLabel: 'Register Free',
                ctaUrl: '/events',
                displayFrequency: 'daily',
                delaySeconds: 5,
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-04-30'),
                isActive: true
            },
            {
                title: '💻 New ICT Batch Starting!',
                content: 'Learn Web Development, MS Office & Graphic Design. Weekend & evening batches available. Industry-ready curriculum with hands-on projects.',
                ctaLabel: 'View Courses',
                ctaUrl: '/courses',
                displayFrequency: 'session',
                delaySeconds: 4,
                startDate: new Date('2026-03-15'),
                endDate: new Date('2026-05-31'),
                isActive: false
            }
        ]);
        console.log('✅ 3 popup banners seeded');

        // --- 3. Offer Banners ---
        await MktOfferBanner.deleteMany({});
        await MktOfferBanner.insertMany([
            {
                text: '🔥 Ramadan Special: 25% OFF on all English courses! Use code: RAMADAN25 — Offer valid till April 15',
                bannerType: 'ticker',
                bgColor: '#1a237e',
                textColor: '#ffd600',
                linkUrl: '/admission',
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-04-15'),
                isActive: true
            },
            {
                text: '📚 Refer a friend & get ৳500 OFF on your next course! Limited time offer.',
                bannerType: 'sticky_top',
                bgColor: '#00695c',
                textColor: '#ffffff',
                linkUrl: '/referral',
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-12-31'),
                isActive: true
            },
            {
                text: '🏆 Our students achieved 95% success rate in SSC English — Join the winning team!',
                bannerType: 'sticky_bottom',
                bgColor: '#b71c1c',
                textColor: '#ffffff',
                linkUrl: '/results',
                isActive: true
            },
            {
                text: '⏰ ICT Crash Course for HSC — Starts March 20! Only 30 seats. Register today!',
                bannerType: 'ticker',
                bgColor: '#e65100',
                textColor: '#ffffff',
                linkUrl: '/courses',
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-03-20'),
                isActive: true
            }
        ]);
        console.log('✅ 4 offer banners seeded');

        // --- 4. Promo Sections ---
        await MktPromoSection.deleteMany({});
        await MktPromoSection.insertMany([
            {
                heading: 'Master English with Confidence',
                subheading: 'From Spoken English to IELTS — We Cover It All',
                body: 'At SS English Lab, we believe every student deserves to communicate confidently in English. Our expert-led courses cover Spoken English, Grammar Mastery, IELTS/TOEFL Preparation, and Academic Writing. With interactive classes, real-world practice, and personalized feedback, you\'ll see results from day one.',
                bgColor: '#e3f2fd',
                ctaLabel: 'Explore English Courses',
                ctaUrl: '/courses#english',
                sortOrder: 1,
                isActive: true
            },
            {
                heading: 'Future-Ready ICT Skills',
                subheading: 'Learn the Technology Skills That Employers Want',
                body: 'Our ICT program covers everything from basic computer literacy to advanced web development. Learn MS Office, Graphic Design (Photoshop & Illustrator), Web Development (HTML, CSS, JavaScript), and Database Management. Hands-on projects and industry-recognized certification included.',
                bgColor: '#fce4ec',
                ctaLabel: 'View ICT Programs',
                ctaUrl: '/courses#ict',
                sortOrder: 2,
                isActive: true
            },
            {
                heading: 'Why Choose SS English Lab?',
                subheading: '500+ Students Transformed Their Careers',
                body: '✓ Expert faculty with 10+ years experience\n✓ Small batch sizes (max 20 students)\n✓ Air-conditioned smart classrooms\n✓ Free Wi-Fi & computer lab access\n✓ Weekend & evening batches available\n✓ Affordable fees with easy installments\n✓ Certificate upon course completion',
                bgColor: '#f3e5f5',
                ctaLabel: 'Meet Our Faculty',
                ctaUrl: '/faculty',
                sortOrder: 3,
                isActive: true
            },
            {
                heading: 'Student Success Stories',
                subheading: 'Hear From Our Alumni',
                body: '"SS English Lab transformed my English skills completely. I went from being afraid to speak to confidently presenting at my office meetings. The IELTS prep course helped me score Band 7.5!" — Rafiq Ahmed, Software Engineer\n\n"The ICT course gave me practical skills that I use every day at work. The web development module was especially helpful in landing my first job." — Fatema Noor, Junior Developer',
                bgColor: '#e8f5e9',
                ctaLabel: 'View All Testimonials',
                ctaUrl: '/testimonials',
                sortOrder: 4,
                isActive: true
            }
        ]);
        console.log('✅ 4 promo sections seeded');

        // --- 5. QR Video Campaigns ---
        await MktQrVideo.deleteMany({});
        await MktQrVideo.insertMany([
            {
                title: 'SS English Lab — Campus Tour 2026',
                videoType: 'youtube',
                videoSource: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                redirectUrl: '/admission',
                animationStyle: 'confetti',
                scanCount: 142,
                watchCount: 98,
                isActive: true
            },
            {
                title: 'Spoken English Course Preview',
                videoType: 'youtube',
                videoSource: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                redirectUrl: '/courses#english',
                animationStyle: 'zoom',
                scanCount: 87,
                watchCount: 64,
                isActive: true
            },
            {
                title: 'ICT Lab & Facilities Showcase',
                videoType: 'youtube',
                videoSource: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                redirectUrl: '/courses#ict',
                animationStyle: 'ripple',
                scanCount: 56,
                watchCount: 41,
                isActive: true
            }
        ]);
        console.log('✅ 3 QR video campaigns seeded');

        console.log('\n🎉 All marketing data seeded successfully for SS English Lab!\n');
        console.log('Summary:');
        console.log('  📋 1 Marketing settings (enabled)');
        console.log('  🪟 3 Popup banners');
        console.log('  📢 4 Offer banners');
        console.log('  📰 4 Promo sections');
        console.log('  🎬 3 QR video campaigns');
        console.log('  ─────────────────────');
        console.log('  📦 15 total documents\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
