/**
 * Seed Script
 * Creates initial admin and staff users, and default site content
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SiteContent = require('../models/SiteContent');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Create admin user
        const adminExists = await User.findOne({ email: 'admin@paragon.com' });
        if (!adminExists) {
            await User.create({
                email: 'admin@paragon.com',
                passwordHash: 'admin123', // Will be hashed by pre-save hook
                name: 'Admin User',
                phone: '01700000001',
                role: 'admin',
                isActive: true,
                mustChangePassword: true
            });
            console.log('✅ Admin user created: admin@paragon.com / admin123');
        } else {
            console.log('Admin user already exists');
        }

        // Create staff user
        const staffExists = await User.findOne({ email: 'staff@paragon.com' });
        if (!staffExists) {
            await User.create({
                email: 'staff@paragon.com',
                passwordHash: 'staff123',
                name: 'Staff User',
                phone: '01700000002',
                role: 'staff',
                isActive: true,
                mustChangePassword: true
            });
            console.log('✅ Staff user created: staff@paragon.com / staff123');
        } else {
            console.log('Staff user already exists');
        }

        // Create default site content
        const defaultContent = [
            {
                sectionKey: 'header',
                title: 'Site Header',
                content: {
                    name: 'PARAGON Coaching Center',
                    logo: '',
                    tagline: 'Excellence in Education',
                    address: 'Dhaka, Bangladesh',
                    phone: '+880 1XXX-XXXXXX',
                    email: 'info@paragon.com'
                },
                order: 0
            },
            {
                sectionKey: 'hero',
                title: 'Hero Section',
                content: {
                    heading: 'Welcome to PARAGON Coaching Center',
                    subheading: 'Empowering Students for Academic Excellence',
                    description: 'Join thousands of successful students who have achieved their dreams with PARAGON. We provide quality education with experienced teachers and modern facilities.',
                    ctaText: 'Enroll Now',
                    ctaLink: '/contact',
                    backgroundImage: '',
                    stats: [
                        { label: 'Students Enrolled', value: '1000+' },
                        { label: 'Expert Teachers', value: '50+' },
                        { label: 'Years of Excellence', value: '10+' },
                        { label: 'Success Rate', value: '95%' }
                    ]
                },
                order: 1
            },
            {
                sectionKey: 'about',
                title: 'About Us',
                content: {
                    heading: 'About PARAGON',
                    description: 'PARAGON Coaching Center was established with a vision to provide quality education and help students achieve their full potential. Our dedicated team of experienced teachers and modern teaching methods ensure that every student receives personalized attention and guidance.',
                    image: '',
                    features: [
                        'Experienced and Qualified Teachers',
                        'Modern Teaching Methods',
                        'Regular Tests and Assessments',
                        'Parent-Teacher Communication',
                        'Comfortable Learning Environment',
                        'Affordable Fee Structure'
                    ]
                },
                order: 2
            },
            {
                sectionKey: 'teachers',
                title: 'Our Teachers',
                content: {
                    heading: 'Meet Our Expert Teachers',
                    description: 'Our team of highly qualified and experienced teachers are dedicated to providing the best education.',
                    teachers: [
                        {
                            name: 'Mr. Rahman',
                            subject: 'Mathematics',
                            qualification: 'M.Sc. in Mathematics',
                            experience: '15 years',
                            image: ''
                        },
                        {
                            name: 'Mrs. Begum',
                            subject: 'English',
                            qualification: 'M.A. in English',
                            experience: '12 years',
                            image: ''
                        },
                        {
                            name: 'Mr. Hossain',
                            subject: 'Physics',
                            qualification: 'M.Sc. in Physics',
                            experience: '10 years',
                            image: ''
                        }
                    ]
                },
                order: 3
            },
            {
                sectionKey: 'success',
                title: 'Success Stories',
                content: {
                    heading: 'Our Success Stories',
                    description: 'We take pride in our students\' achievements',
                    students: [
                        {
                            name: 'Rahim Ahmed',
                            achievement: 'GPA 5.00 in SSC',
                            year: '2023',
                            image: '',
                            testimonial: 'PARAGON helped me achieve my dream of getting GPA 5.00. The teachers are amazing!'
                        },
                        {
                            name: 'Fatima Khan',
                            achievement: 'Golden A+ in HSC',
                            year: '2023',
                            image: '',
                            testimonial: 'I am grateful to PARAGON for their support and guidance throughout my HSC preparation.'
                        }
                    ]
                },
                order: 4
            },
            {
                sectionKey: 'facilities',
                title: 'Our Facilities',
                content: {
                    heading: 'World-Class Facilities',
                    description: 'We provide the best learning environment for our students',
                    facilities: [
                        {
                            title: 'Modern Classrooms',
                            description: 'Air-conditioned classrooms with comfortable seating',
                            icon: 'classroom'
                        },
                        {
                            title: 'Digital Learning',
                            description: 'Smart boards and multimedia presentations',
                            icon: 'digital'
                        },
                        {
                            title: 'Library',
                            description: 'Well-stocked library with study materials',
                            icon: 'library'
                        },
                        {
                            title: 'Online Classes',
                            description: 'Flexible online learning options',
                            icon: 'online'
                        }
                    ]
                },
                order: 5
            },
            {
                sectionKey: 'services',
                title: 'Our Services',
                content: {
                    heading: 'What We Offer',
                    services: [
                        {
                            title: 'SSC Preparation',
                            description: 'Complete SSC exam preparation for all subjects',
                            icon: 'book'
                        },
                        {
                            title: 'HSC Preparation',
                            description: 'Comprehensive HSC coaching for Science, Commerce, and Arts',
                            icon: 'graduation'
                        },
                        {
                            title: 'Admission Coaching',
                            description: 'University admission test preparation',
                            icon: 'university'
                        },
                        {
                            title: 'Regular Classes',
                            description: 'Weekly classes for Class 6-12 students',
                            icon: 'calendar'
                        }
                    ]
                },
                order: 6
            },
            {
                sectionKey: 'contact',
                title: 'Contact Us',
                content: {
                    heading: 'Get In Touch',
                    description: 'Have questions? Contact us today!',
                    address: 'House #XX, Road #XX, Dhaka, Bangladesh',
                    phone: '+880 1XXX-XXXXXX',
                    email: 'info@paragon.com',
                    mapEmbed: '',
                    socialLinks: {
                        facebook: '',
                        youtube: '',
                        instagram: ''
                    }
                },
                order: 7
            },
            {
                sectionKey: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 PARAGON Coaching Center. All rights reserved.',
                    links: [
                        { label: 'Privacy Policy', url: '/privacy' },
                        { label: 'Terms of Service', url: '/terms' }
                    ]
                },
                order: 8
            }
        ];

        for (const content of defaultContent) {
            const exists = await SiteContent.findOne({ sectionKey: content.sectionKey });
            if (!exists) {
                await SiteContent.create(content);
                console.log(`✅ Created site content: ${content.sectionKey}`);
            }
        }

        console.log('\n🎉 Database seeding completed!');
        console.log('\nDefault credentials:');
        console.log('Admin: admin@paragon.com / admin123');
        console.log('Staff: staff@paragon.com / staff123');
        console.log('\nPlease change these passwords after first login.');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();
