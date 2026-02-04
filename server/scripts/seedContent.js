const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

console.log('Loading env from:', path.join(__dirname, '../.env'));
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');

const Faculty = require('../src/models/Faculty');
const Course = require('../src/models/Course');
const Topper = require('../src/models/Topper');
const Testimonial = require('../src/models/Testimonial');
const Media = require('../src/models/Media');

// Database Connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';
        console.log(`Connecting to MongoDB at ${uri.split('@')[1] || 'localhost'}...`);

        const conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Data to seed

const mediaData = [
    {
        filename: 'faculty-1.jpg',
        url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop',
        publicId: 'seed/faculty-1',
        type: 'image',
        folder: 'faculty',
        alt: 'Faculty member 1'
    },
    {
        filename: 'faculty-2.jpg',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
        publicId: 'seed/faculty-2',
        type: 'image',
        folder: 'faculty',
        alt: 'Faculty member 2'
    },
    {
        filename: 'faculty-3.jpg',
        url: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?w=400&h=400&fit=crop',
        publicId: 'seed/faculty-3',
        type: 'image',
        folder: 'faculty',
        alt: 'Faculty member 3'
    },
    {
        filename: 'faculty-4.jpg',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        publicId: 'seed/faculty-4',
        type: 'image',
        folder: 'faculty',
        alt: 'Faculty member 4'
    },
    {
        filename: 'course-engineering.jpg',
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=500&fit=crop',
        publicId: 'seed/course-eng',
        type: 'image',
        folder: 'courses',
        alt: 'Engineering Course'
    },
    {
        filename: 'course-university.jpg',
        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop',
        publicId: 'seed/course-uni',
        type: 'image',
        folder: 'courses',
        alt: 'University Admission'
    },
    {
        filename: 'topper-1.jpg',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        publicId: 'seed/topper-1',
        type: 'image',
        folder: 'toppers',
        alt: 'Top Student 1'
    },
    {
        filename: 'topper-2.jpg',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
        publicId: 'seed/topper-2',
        type: 'image',
        folder: 'toppers',
        alt: 'Top Student 2'
    }
];

const facultyData = [
    {
        name: "Dr. Rafiqul Islam",
        designation: "Senior Physics Lecturer",
        subjects: ["physics"],
        qualifications: ["M.Sc in Physics (DU)", "PhD (Japan)"],
        experience: { totalYears: 15, teachingSince: 2009 },
        achievements: ["Best Teacher Award 2023", "Author of 'Physics for Admission'"],
        bio: "Expert in breaking down complex physics concepts into simple, understandable lessons. Helping students crack BUET & DU for over a decade.",
        contact: { email: "rafiqul@paragon.com" },
        featured: true,
        displayOrder: 1,
        // Will link photo dynamically
    },
    {
        name: "Sadia Rahman",
        designation: "Chemistry Head",
        subjects: ["chemistry"],
        qualifications: ["B.Sc & M.Sc in Chemistry (DU)"],
        experience: { totalYears: 10, teachingSince: 2014 },
        bio: "Specialist in Organic Chemistry. Her unique teaching methods have helped thousands of students ace their chemistry exams.",
        featured: true,
        displayOrder: 2,
    },
    {
        name: "Kamrul Hasan",
        designation: "Mathematics Mentor",
        subjects: ["mathematics"],
        qualifications: ["B.Sc in Mathematics (BUET)"],
        experience: { totalYears: 8, teachingSince: 2016 },
        bio: "A BUET graduate who knows exactly what it takes to solve math problems quickly and accurately.",
        featured: true,
        displayOrder: 3,
    },
    {
        name: "Anas Mahmud",
        designation: "Biology Expert",
        subjects: ["biology"],
        qualifications: ["MBBS (DMC)"],
        experience: { totalYears: 5, teachingSince: 2019 },
        bio: "A pragmatic approach to Biology. Learn from a doctor who has been through the medical admission journey.",
        displayOrder: 4,
    }
];

// Helper to slugify
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

const courseData = [
    {
        name: "Engineering Admission Program 2025",
        slug: slugify("Engineering Admission Program 2025"),
        shortDescription: "Comprehensive preparation for BUET, RUET, CUET, KUET, and other engineering universities.",
        fullDescription: "<p>Our Engineering Admission Program is designed to build a strong foundation in Physics, Chemistry, and Mathematics. We focus on conceptual clarity and problem-solving speed.</p><ul><li>Daily Live Classes</li><li>Chapter-wise Exams</li><li>Model Tests</li><li>Solve Sheets</li></ul>",
        category: "engineering",
        duration: "6 Months",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-12-31"),
        pricing: { original: 15000, discounted: 12000 },
        tags: ["BUET", "Engineering", "CKRUET"],
        featured: true,
        displayOrder: 1,
        status: "published",
        studyMaterials: ["printed_books", "online_notes", "practice_papers"],
        features: ["Printed Lecture Sheets", "Weekly Model Tests", "24/7 Doubt Solving"]
    },
    {
        name: "University 'A' Unit (Science) Program",
        slug: slugify("University A Unit Science Program"),
        shortDescription: "Target DU, RU, CU, JU and GST Science units with our specialized program.",
        fullDescription: "<p>Prepare for top public universities in Bangladesh. This course covers everything you need for the Science unit admission tests.</p>",
        category: "university",
        duration: "5 Months",
        startDate: new Date("2025-08-01"),
        pricing: { original: 12000, discounted: 10000 },
        tags: ["DU", "Science", "GST"],
        featured: true,
        displayOrder: 2,
        status: "published",
        studyMaterials: ["online_notes", "live_classes"],
        features: ["Live Classes", "Recorded Videos", "Question Bank Solve"]
    },
    {
        name: "Medical Admission Regular Batch",
        slug: slugify("Medical Admission Regular Batch"),
        shortDescription: "Be a future doctor. Rigorous preparation for MBBS & BDS admission tests.",
        category: "medical",
        duration: "7 Months",
        pricing: { original: 18000, discounted: 15000 },
        tags: ["Medical", "MBBS", "DMC"],
        featured: true,
        displayOrder: 3,
        status: "published"
    },
    {
        name: "Varsity 'B' & 'C' Unit (Arts & Commerce)",
        slug: slugify("Varsity B and C Unit Arts Commerce"),
        shortDescription: "Special care for Bangla, English, GK, Accounting, and Management.",
        category: "university",
        duration: "5 Months",
        pricing: { original: 10000, discounted: 8000 },
        tags: ["Arts", "Commerce", "DU B Unit"],
        displayOrder: 4,
        status: "published"
    }
];

const topperData = [
    {
        studentName: "Tahmid Hasan",
        exam: "buet",
        examName: "BUET Admission Test 2024",
        year: 2024,
        rank: "Merit 12",
        successStory: "Paragon's engineering program was a game changer for me. Thesolve classes helped specifically with the tough math problems.",
        institution: "BUET (CSE)",
        featured: true,
        displayOrder: 1,
        isActive: true
    },
    {
        studentName: "Nusrat Jahan",
        exam: "medical",
        examName: "Medical Admission Test 2024",
        year: 2024,
        rank: "Merit 56",
        successStory: "I always wanted to be a doctor. The biology notes provided by Paragon were concise and directly relevant to the exam.",
        institution: "Dhaka Medical College",
        featured: true,
        displayOrder: 2,
        isActive: true
    },
    {
        studentName: "Rakib Ahmed",
        exam: "du_ka",
        examName: "DU 'A' Unit 2024",
        year: 2024,
        rank: "Merit 89",
        institution: "University of Dhaka (Physics)",
        successStory: "Consistent model tests at Paragon helped me manage my time effectively during the actual exam.",
        displayOrder: 3,
        isActive: true
    }
];

const testimonialData = [
    {
        studentName: "Ayesha Siddiqua",
        courseName: "Medical Batch 2023",
        quote: "The teachers are extremely supportive. They don't just teach, they mentor us. I couldn't have asked for better guidance.",
        rating: 5,
        featured: true,
        displayOrder: 1
    },
    {
        studentName: "Karim Ullah",
        courseName: "Engineering 2023",
        quote: "Excellent study materials. The question bank solutions were very detailed and helpful.",
        rating: 5,
        featured: true,
        displayOrder: 2
    },
    {
        studentName: "Sumaiya Akter",
        courseName: "Varsity 'A' Unit",
        quote: "The online exam platform is very rigorous and prepares you for the pressure of the real test.",
        rating: 4,
        featured: true,
        displayOrder: 3
    }
];

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing existing data...');
        // Optional: Clear existing data - comment out if you want to append
        await Faculty.deleteMany({});
        await Course.deleteMany({});
        await Topper.deleteMany({});
        await Testimonial.deleteMany({});
        await Media.deleteMany({});

        console.log('Seeding Media...');
        const createdMedia = await Media.insertMany(mediaData);
        const getMedia = (publicIdPart) => createdMedia.find(m => m.publicId.includes(publicIdPart)) || null;

        console.log('Seeding Faculty...');
        const facultyWithPhotos = facultyData.map((f, index) => ({
            ...f,
            photo: getMedia(`faculty-${index + 1}`) ? {
                url: getMedia(`faculty-${index + 1}`).url,
                publicId: getMedia(`faculty-${index + 1}`).publicId,
                alt: f.name
            } : undefined
        }));
        const createdFaculty = await Faculty.insertMany(facultyWithPhotos);

        console.log('Seeding Courses...');
        const engineeringCourseImg = getMedia('course-eng');
        const uniCourseImg = getMedia('course-uni');

        const coursesWithFaculty = courseData.map((c, index) => {
            let img = null;
            if (c.category === 'engineering') img = engineeringCourseImg;
            else if (c.category === 'university') img = uniCourseImg;

            // Assign random faculty
            const randomFaculty = createdFaculty
                .sort(() => 0.5 - Math.random())
                .slice(0, 2)
                .map(f => f._id);

            return {
                ...c,
                faculty: randomFaculty,
                image: img ? { url: img.url, publicId: img.publicId, alt: c.name } : undefined
            };
        });
        const createdCourses = await Course.insertMany(coursesWithFaculty);

        console.log('Seeding Toppers...');
        const toppersWithRefs = topperData.map((t, index) => {
            const relatedCourse = createdCourses.find(c =>
                (t.exam === 'buet' && c.category === 'engineering') ||
                (t.exam === 'medical' && c.category === 'medical') ||
                (c.category === 'university')
            ) || createdCourses[0];

            return {
                ...t,
                course: relatedCourse._id,
                courseName: relatedCourse.name,
                photo: getMedia(`topper-${index + 1}`) ? {
                    url: getMedia(`topper-${index + 1}`).url,
                    publicId: getMedia(`topper-${index + 1}`).publicId,
                    alt: t.studentName
                } : undefined
            };
        });
        await Topper.insertMany(toppersWithRefs);

        console.log('Seeding Testimonials...');
        const testimonialsWithRefs = testimonialData.map(t => {
            const relatedCourse = createdCourses[Math.floor(Math.random() * createdCourses.length)];
            return {
                ...t,
                course: relatedCourse._id,
                courseName: relatedCourse.name,
                photo: getMedia(`faculty-${Math.floor(Math.random() * 4) + 1}`) ? { // Reusing faculty imgs for demo
                    url: getMedia(`faculty-${Math.floor(Math.random() * 4) + 1}`).url,
                    publicId: getMedia(`faculty-${Math.floor(Math.random() * 4) + 1}`).publicId,
                    alt: t.studentName
                } : undefined
            }
        });
        await Testimonial.insertMany(testimonialsWithRefs);

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

seedData();
