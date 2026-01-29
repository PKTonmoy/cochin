/**
 * Seed CMS Pages
 * Creates initial "home" and "stories" pages in the CMS
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';

// Define schema inline to avoid model conflicts
const sectionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    styles: { type: mongoose.Schema.Types.Mixed, default: {} },
    animation: { type: mongoose.Schema.Types.Mixed, default: {} },
    responsive: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const pageSchema = new mongoose.Schema({
    pageName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, default: 'published' },
    template: { type: String, default: 'content' },
    sections: [sectionSchema],
    publishedSections: [sectionSchema],
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: { type: mongoose.Schema.Types.Mixed, default: {} },
    currentVersion: { type: Number, default: 1 },
    publishedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Page = mongoose.model('Page', pageSchema);

// Home page sections
const homeSections = [
    {
        id: uuidv4(),
        type: 'hero',
        order: 0,
        visible: true,
        content: {
            headline: {
                text: 'বাংলাদেশের সেরা শিক্ষা প্রস্তুতি প্ল্যাটফর্ম',
                fontSize: '48px',
                color: '#ffffff',
                fontWeight: '700'
            },
            subheadline: {
                text: 'মেডিকেল, ইঞ্জিনিয়ারিং ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় সফলতার জন্য প্যারাগন কোচিং সেন্টারে যোগ দিন',
                fontSize: '20px',
                color: '#f3f4f6'
            },
            backgroundImage: { url: '', alt: '' },
            buttons: [
                { text: 'প্রোগ্রাম দেখুন', link: '#programs', style: 'primary' },
                { text: 'যোগাযোগ করুন', link: '#contact', style: 'secondary' }
            ],
            overlay: { enabled: true, color: 'rgba(0,0,0,0.5)' }
        },
        styles: {
            minHeight: '600px',
            backgroundGradient: 'linear-gradient(135deg, #1a5276 0%, #0d3b66 100%)'
        }
    },
    {
        id: uuidv4(),
        type: 'statistics',
        order: 1,
        visible: true,
        content: {
            title: { text: 'সংখ্যায় প্যারাগন', fontSize: '32px', color: '#1f2937' },
            stats: [
                { value: 1000, suffix: '+', label: 'শিক্ষার্থী', icon: 'users' },
                { value: 50, suffix: '+', label: 'অভিজ্ঞ শিক্ষক', icon: 'graduation-cap' },
                { value: 10, suffix: '+', label: 'বছরের অভিজ্ঞতা', icon: 'award' },
                { value: 95, suffix: '%', label: 'সাফল্যের হার', icon: 'trending-up' }
            ],
            animated: true
        }
    },
    {
        id: uuidv4(),
        type: 'text',
        order: 2,
        visible: true,
        content: {
            title: { text: 'আমাদের সম্পর্কে', fontSize: '36px', color: '#1f2937', fontWeight: '700' },
            body: '<p>প্যারাগন কোচিং সেন্টার বাংলাদেশের অন্যতম শীর্ষস্থানীয় শিক্ষা প্রতিষ্ঠান। গত এক দশকেরও বেশি সময় ধরে আমরা শিক্ষার্থীদের সাফল্যের পথে এগিয়ে নিয়ে যাচ্ছি।</p><p>আমাদের মিশন হলো প্রতিটি শিক্ষার্থীকে তার স্বপ্ন পূরণে সহায়তা করা।</p>',
            alignment: 'center'
        },
        styles: {
            padding: { top: '60px', bottom: '60px', left: '20px', right: '20px' },
            backgroundColor: '#f8fafc'
        }
    },
    {
        id: uuidv4(),
        type: 'cardGrid',
        order: 3,
        visible: true,
        content: {
            title: { text: 'আমাদের প্রোগ্রামসমূহ', fontSize: '32px', color: '#1f2937' },
            cards: [
                { title: 'Medical Admission 2026', description: 'মেডিকেল ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', icon: 'heart' },
                { title: 'Engineering Admission', description: 'ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', icon: 'zap' },
                { title: 'HSC Academic Program', description: 'একাদশ-দ্বাদশ শ্রেণীর জন্য একাডেমিক প্রোগ্রাম', icon: 'book' },
                { title: 'DU Admission Crash', description: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার জন্য ক্র্যাশ কোর্স', icon: 'graduation-cap' },
                { title: 'SSC Foundation', description: 'এসএসসি পরীক্ষার্থীদের জন্য ফাউন্ডেশন কোর্স', icon: 'file-text' },
                { title: 'Free Trial Class', description: 'বিনামূল্যে ট্রায়াল ক্লাস নিন', icon: 'play' }
            ],
            columns: 3,
            cardStyle: 'elevated'
        }
    },
    {
        id: uuidv4(),
        type: 'testimonial',
        order: 4,
        visible: true,
        content: {
            title: { text: 'সফল শিক্ষার্থীদের মতামত', fontSize: '32px', color: '#1f2937' },
            testimonials: [
                { name: 'রহিম আহমেদ', role: 'BUET CSE 2024', content: 'প্যারাগনের শিক্ষকদের গাইডেন্স ছাড়া আমার পক্ষে BUET-এ চান্স পাওয়া সম্ভব ছিল না।', rating: 5 },
                { name: 'ফাতিমা খান', role: 'Dhaka Medical 2024', content: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতি নেওয়ার জন্য প্যারাগন সেরা জায়গা।', rating: 5 },
                { name: 'করিম সাহেব', role: 'Engineering 2024', content: 'অনলাইনে ক্লাস করেও ভালো রেজাল্ট করা সম্ভব - প্যারাগন এটি প্রমাণ করেছে।', rating: 5 }
            ],
            layout: 'carousel'
        },
        styles: {
            backgroundColor: '#1a5276',
            padding: { top: '60px', bottom: '60px', left: '20px', right: '20px' }
        }
    },
    {
        id: uuidv4(),
        type: 'cta',
        order: 5,
        visible: true,
        content: {
            headline: { text: 'আজই শুরু করুন আপনার সফলতার যাত্রা', fontSize: '36px', color: '#ffffff', fontWeight: '700' },
            subheadline: { text: 'বিনামূল্যে ট্রায়াল ক্লাসে যোগ দিন', fontSize: '18px', color: '#f3f4f6' },
            buttons: [
                { text: 'এখনই ভর্তি হন', link: '#contact', style: 'primary' },
                { text: 'কল করুন', link: 'tel:09666775566', style: 'secondary' }
            ],
            backgroundGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
        }
    },
    {
        id: uuidv4(),
        type: 'form',
        order: 6,
        visible: true,
        content: {
            title: { text: 'যোগাযোগ করুন', fontSize: '32px', color: '#1f2937' },
            fields: [
                { type: 'text', name: 'name', label: 'নাম', required: true },
                { type: 'tel', name: 'phone', label: 'ফোন', required: true },
                { type: 'select', name: 'class', label: 'ক্লাস', options: ['৯ম শ্রেণী', '১০ম শ্রেণী', 'একাদশ', 'দ্বাদশ', 'ভর্তি পরীক্ষার্থী'], required: true },
                { type: 'textarea', name: 'message', label: 'বার্তা', required: false }
            ],
            submitText: 'ফ্রি ক্লাস বুক করুন',
            successMessage: 'ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
        }
    }
];

// Stories page sections
const storiesSections = [
    {
        id: uuidv4(),
        type: 'hero',
        order: 0,
        visible: true,
        content: {
            headline: { text: 'সাফল্যের গল্প', fontSize: '48px', color: '#ffffff', fontWeight: '700' },
            subheadline: { text: 'আমাদের সফল শিক্ষার্থীদের অনুপ্রেরণামূলক গল্প', fontSize: '20px', color: '#f3f4f6' },
            backgroundImage: { url: '', alt: '' },
            buttons: [],
            overlay: { enabled: true, color: 'rgba(0,0,0,0.5)' }
        },
        styles: {
            minHeight: '400px',
            backgroundGradient: 'linear-gradient(135deg, #1a5276 0%, #0d3b66 100%)'
        }
    },
    {
        id: uuidv4(),
        type: 'testimonial',
        order: 1,
        visible: true,
        content: {
            title: { text: 'আমাদের সফল শিক্ষার্থী', fontSize: '32px', color: '#1f2937' },
            testimonials: [
                { name: 'রহিম আহমেদ', role: 'BUET CSE - Merit Position: 45', content: 'প্যারাগনের শিক্ষকদের গাইডেন্স ছাড়া আমার পক্ষে BUET-এ চান্স পাওয়া সম্ভব ছিল না। তাদের পরিশ্রম ও আন্তরিকতা অসাধারণ।', rating: 5 },
                { name: 'ফাতিমা খান', role: 'Dhaka Medical - Merit Position: 128', content: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতি নেওয়ার জন্য প্যারাগন সেরা জায়গা। এখানকার পড়াশোনার মান অনন্য।', rating: 5 },
                { name: 'করিম সাহেব', role: 'Engineering - Merit Position: 89', content: 'অনলাইনে ক্লাস করেও ভালো রেজাল্ট করা সম্ভব - প্যারাগন এটি প্রমাণ করেছে।', rating: 5 },
                { name: 'সোনিয়া আক্তার', role: 'DU Ka Unit - Merit Position: 156', content: 'ঢাকা বিশ্ববিদ্যালয়ে চান্স পাওয়ার জন্য প্যারাগনের কোনো বিকল্প নেই।', rating: 5 },
                { name: 'আকাশ হোসেন', role: 'BUET EEE - Merit Position: 67', content: 'প্যারাগনের পদ্ধতিগত পড়াশোনা এবং নিয়মিত পরীক্ষা আমার সাফল্যের মূল কারণ।', rating: 5 },
                { name: 'নুসরাত জাহান', role: 'Chittagong Medical', content: 'প্যারাগনে পড়ে মেডিকেলে চান্স পেয়েছি। শিক্ষকদের প্রতি কৃতজ্ঞ।', rating: 5 }
            ],
            layout: 'grid'
        },
        styles: {
            padding: { top: '60px', bottom: '60px', left: '20px', right: '20px' }
        }
    },
    {
        id: uuidv4(),
        type: 'cta',
        order: 2,
        visible: true,
        content: {
            headline: { text: 'আপনিও হতে পারেন সফল', fontSize: '36px', color: '#ffffff', fontWeight: '700' },
            subheadline: { text: 'আজই যোগ দিন প্যারাগনে', fontSize: '18px', color: '#f3f4f6' },
            buttons: [
                { text: 'এখনই ভর্তি হন', link: '/#contact', style: 'primary' }
            ],
            backgroundGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
        }
    }
];

async function seedPages() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if pages already exist
        const existingHome = await Page.findOne({ slug: 'home' });
        const existingStories = await Page.findOne({ slug: 'stories' });

        if (existingHome) {
            console.log('Home page already exists, skipping...');
        } else {
            const homePage = new Page({
                pageName: 'Home',
                slug: 'home',
                status: 'published',
                template: 'landing',
                sections: homeSections,
                publishedSections: homeSections,
                publishedAt: new Date(),
                seo: {
                    title: 'PARAGON - বাংলাদেশের সেরা শিক্ষা প্রস্তুতি প্ল্যাটফর্ম',
                    description: 'মেডিকেল, ইঞ্জিনিয়ারিং ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় সফলতার জন্য প্যারাগন কোচিং সেন্টারে যোগ দিন'
                }
            });
            await homePage.save();
            console.log('✓ Home page created');
        }

        if (existingStories) {
            console.log('Stories page already exists, skipping...');
        } else {
            const storiesPage = new Page({
                pageName: 'Success Stories',
                slug: 'stories',
                status: 'published',
                template: 'content',
                sections: storiesSections,
                publishedSections: storiesSections,
                publishedAt: new Date(),
                seo: {
                    title: 'সাফল্যের গল্প - PARAGON',
                    description: 'আমাদের সফল শিক্ষার্থীদের অনুপ্রেরণামূলক গল্প'
                }
            });
            await storiesPage.save();
            console.log('✓ Stories page created');
        }

        console.log('\\n✅ Seed completed successfully!');
        console.log('\\nYou can now:');
        console.log('1. Visit http://localhost:5173 to see the home page');
        console.log('2. Visit http://localhost:5173/stories to see the stories page');
        console.log('3. Edit pages at http://localhost:5173/admin/cms');

    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedPages();
