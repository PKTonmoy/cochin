import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { HeroSection3D } from '../../components/hero'
import {
    GraduationCap,
    Users,
    Award,
    BookOpen,
    CheckCircle,
    Star,
    Phone,
    Mail,
    MapPin,
    ArrowRight,
    ArrowUp,
    Play,
    Monitor,
    Target,
    FileText,
    MessageCircle,
    Smartphone,
    BarChart3,
    ChevronDown,
    Sparkles,
    Building2,
    Globe,
    Clock,
    Trophy,
    Heart,
    Zap,
    Check,
    Facebook,
    Instagram,
    Youtube,
    Twitter,
    ChevronLeft,
    ChevronRight,
    X,
    TrendingUp
} from 'lucide-react'

// ===== HOOKS =====

// Counter animation hook
const useCountUp = (end, duration = 2000, startOnView = true) => {
    const [count, setCount] = useState(0)
    const [hasStarted, setHasStarted] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!startOnView) setHasStarted(true)
    }, [startOnView])

    useEffect(() => {
        if (!hasStarted) return
        let startTime
        let animationFrame

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [end, duration, hasStarted])

    useEffect(() => {
        if (!startOnView || !ref.current) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true) },
            { threshold: 0.3 }
        )
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [startOnView, hasStarted])

    return { count, ref }
}

// Scroll progress hook
const useScrollProgress = () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight
            const scrollProgress = (window.scrollY / totalHeight) * 100
            setProgress(scrollProgress)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return progress
}

// ===== COMPONENTS =====

// Scroll Progress Indicator
const ScrollProgress = () => {
    const progress = useScrollProgress()
    return (
        <div className="scroll-progress">
            <div className="scroll-progress-bar" style={{ width: `${progress}%` }} />
        </div>
    )
}

// Back to Top Button
const BackToTop = () => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 500)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <button
            className={`back-to-top ${visible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Back to top"
        >
            <ArrowUp size={24} />
        </button>
    )
}

// Modern Stat Card
const StatCardModern = ({ value, suffix = '+', label, icon: Icon, delay = 0, progress = 75 }) => {
    const { count, ref } = useCountUp(parseInt(value), 2000)
    const [animateProgress, setAnimateProgress] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setAnimateProgress(true) },
            { threshold: 0.3 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [ref])

    return (
        <div
            ref={ref}
            className="stat-card-modern reveal"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="stat-icon">
                <Icon size={32} />
            </div>
            <p className="stat-value">{count}{suffix}</p>
            <p className="stat-label">{label}</p>
            <div className="stat-progress">
                <div
                    className="stat-progress-bar"
                    style={{ width: animateProgress ? `${progress}%` : '0%' }}
                />
            </div>
        </div>
    )
}

// Modern Course Card
const CourseCardModern = ({ course, index }) => {
    const icons = {
        medical: Heart,
        engineering: Zap,
        hsc: BookOpen,
        ssc: FileText,
        university: GraduationCap,
        default: Target
    }
    const Icon = icons[course.type] || icons.default

    return (
        <div
            className="course-card-modern reveal"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="card-image">
                <div className="card-icon">
                    <Icon size={36} />
                </div>
            </div>
            <div className="card-body">
                {course.badge && (
                    <span className={`card-badge ${course.badge.toLowerCase()}`}>
                        {course.badge}
                    </span>
                )}
                <h3 className="card-title font-bangla">{course.title}</h3>
                <p className="card-description font-bangla">{course.description}</p>
                <div className="card-features">
                    {course.features?.slice(0, 3).map((feature, i) => (
                        <span key={i} className="feature-tag font-bangla">{feature}</span>
                    ))}
                </div>
                <div className="card-footer">
                    <span className="text-secondary font-bold">{course.price || 'বিস্তারিত'}</span>
                    <span className="learn-more">
                        আরও জানুন <ArrowRight size={16} />
                    </span>
                </div>
            </div>
        </div>
    )
}

// Feature Card
const FeatureCardModern = ({ feature, index }) => {
    const icons = {
        monitor: Monitor,
        users: Users,
        book: BookOpen,
        target: Target,
        filetext: FileText,
        message: MessageCircle,
        phone: Smartphone,
        chart: BarChart3,
        clock: Clock,
        trophy: Trophy
    }
    const Icon = icons[feature.icon] || Sparkles

    return (
        <div
            className="card-feature p-6 md:p-8 group reveal"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Icon size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-[var(--dark)] mb-2 font-bangla">{feature.title}</h3>
            <p className="text-gray-500 text-sm md:text-base font-bangla">{feature.description}</p>
        </div>
    )
}

// Testimonial Tweet Card
const TestimonialTweet = ({ testimonial, index }) => {
    return (
        <div
            className="testimonial-tweet reveal"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="tweet-header">
                <div className="avatar">
                    {testimonial.name?.charAt(0) || 'S'}
                </div>
                <div className="user-info">
                    <div className="user-name font-bangla">
                        {testimonial.name}
                        <span className="verified-badge">
                            <Check size={10} />
                        </span>
                    </div>
                    <div className="user-handle">
                        {testimonial.achievement} • {testimonial.year}
                    </div>
                </div>
                <div className="tweet-platform">
                    <Star size={20} />
                </div>
            </div>
            <p className="tweet-content font-bangla">"{testimonial.testimonial}"</p>
            {testimonial.result && (
                <div className="tweet-result">
                    <Trophy size={16} />
                    {testimonial.result}
                </div>
            )}
            <div className="tweet-footer">
                <div className="star-rating">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                    ))}
                </div>
                <span>{testimonial.date || 'সাম্প্রতিক'}</span>
            </div>
        </div>
    )
}

// Faculty Card
const FacultyCard = ({ faculty, index }) => {
    return (
        <div
            className="faculty-card reveal"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="faculty-image">
                {faculty.image ? (
                    <img src={faculty.image} alt={faculty.name} />
                ) : (
                    faculty.name?.charAt(0) || 'T'
                )}
            </div>
            <h3 className="faculty-name font-bangla">{faculty.name}</h3>
            <p className="faculty-subject font-bangla">{faculty.subject}</p>
            <p className="faculty-experience">{faculty.experience}</p>
        </div>
    )
}



// Image Lightbox
const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
    if (currentIndex === null) return null

    return (
        <div className={`lightbox-overlay ${currentIndex !== null ? 'active' : ''}`} onClick={onClose}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <button className="lightbox-close" onClick={onClose}>
                    <X size={20} />
                </button>
                <button className="lightbox-nav prev" onClick={onPrev}>
                    <ChevronLeft size={24} />
                </button>
                <img src={images[currentIndex]} alt="Gallery" />
                <button className="lightbox-nav next" onClick={onNext}>
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    )
}

// Gallery Section
const GallerySection = () => {
    const [lightboxIndex, setLightboxIndex] = useState(null)

    const images = [
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop'
    ]

    const captions = [
        'ক্লাসরুম সেশন',
        'গ্রুপ স্টাডি',
        'পরীক্ষার প্রস্তুতি',
        'আধুনিক সুবিধা',
        'লাইব্রেরি',
        'সাফল্য উদযাপন'
    ]

    return (
        <>
            <div className="masonry-grid">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className="grid-item"
                        onClick={() => setLightboxIndex(index)}
                    >
                        <img src={img} alt={captions[index]} loading="lazy" />
                        <div className="overlay-text">
                            <p className="font-bold font-bangla">{captions[index]}</p>
                        </div>
                    </div>
                ))}
            </div>
            <Lightbox
                images={images}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={() => setLightboxIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                onNext={() => setLightboxIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            />
        </>
    )
}

// ===== MAIN COMPONENT =====

const LandingPage = () => {
    const [content, setContent] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/site-content')
                setContent(response.data.data || {})
            } catch (error) {
                console.error('Failed to fetch site content:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchContent()
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible') }),
            { threshold: 0.1 }
        )
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [loading])

    // Content from API or defaults
    const hero = content.hero?.content || {}
    const about = content.about?.content || {}
    const success = content.success?.content || {}
    const contactInfo = content.contact?.content || {}
    const programs = content.programs?.content || {}
    const features = content.features?.content || {}

    // Default data
    const defaultStats = [
        { label: 'Students Enrolled', value: '1000', suffix: '+', icon: Users, progress: 85 },
        { label: 'Expert Teachers', value: '50', suffix: '+', icon: GraduationCap, progress: 90 },
        { label: 'Years of Excellence', value: '10', suffix: '+', icon: Award, progress: 75 },
        { label: 'Success Rate', value: '95', suffix: '%', icon: Trophy, progress: 95 },
    ]

    const defaultCourses = [
        { title: 'Medical Admission 2026', description: 'মেডিকেল ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', badge: 'Popular', type: 'medical', features: ['মেধাবী শিক্ষক', 'লাইভ ক্লাস', 'এক্সাম'] },
        { title: 'Engineering Admission', description: 'ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', badge: 'New', type: 'engineering', features: ['BUET ফোকাস', 'মডেল টেস্ট', 'Q&A'] },
        { title: 'HSC Academic Program', description: 'একাদশ-দ্বাদশ শ্রেণীর জন্য একাডেমিক প্রোগ্রাম', type: 'hsc', features: ['বোর্ড প্রস্তুতি', 'চ্যাপ্টার ক্লাস', 'পরীক্ষা'] },
        { title: 'DU Admission Crash', description: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার জন্য ক্র্যাশ কোর্স', badge: 'Hot', type: 'university', features: ['Ka ও Kha Unit', 'শর্ট সিলেবাস'] },
        { title: 'SSC Foundation', description: 'এসএসসি পরীক্ষার্থীদের জন্য ফাউন্ডেশন কোর্স', type: 'ssc', features: ['সকল বিষয়', 'উইকলি টেস্ট'] },
        { title: 'Free Trial Class', description: 'বিনামূল্যে ট্রায়াল ক্লাস নিন', badge: 'Free', type: 'default', features: ['ডেমো ক্লাস', 'কোর্স পরিচিতি'] }
    ]

    const defaultFeatures = [
        { title: 'অফলাইন/অনলাইন প্রোগ্রাম', description: 'আপনার সুবিধামত শিখুন যেকোনো জায়গা থেকে', icon: 'monitor' },
        { title: 'মেধাবী ও অভিজ্ঞ শিক্ষক', description: 'দেশসেরা শিক্ষকদের কাছ থেকে শিখুন', icon: 'users' },
        { title: 'মানসম্মত স্টাডি ম্যাটেরিয়ালস', description: 'গবেষণালব্ধ ও আপডেটেড শিক্ষা উপকরণ', icon: 'book' },
        { title: 'কনসেপ্ট বেইজড ক্লাস', description: 'মুখস্থ নয়, ধারণাভিত্তিক শেখা', icon: 'target' },
        { title: 'ইউনিক এক্সাম সিস্টেম', description: 'নিয়মিত পরীক্ষা ও মূল্যায়ন', icon: 'filetext' },
        { title: 'সার্বক্ষণিক Q&A সেবা', description: '24/7 প্রশ্নের উত্তর পান', icon: 'message' },
        { title: 'Auto SMS রেজাল্ট', description: 'অভিভাবকদের কাছে স্বয়ংক্রিয় রেজাল্ট', icon: 'phone' },
        { title: 'এক্সাম এনালাইসিস রিপোর্ট', description: 'বিস্তারিত পারফরম্যান্স বিশ্লেষণ', icon: 'chart' }
    ]

    const defaultTestimonials = [
        { name: 'রহিম আহমেদ', achievement: 'BUET CSE', year: '2024', testimonial: 'প্যারাগনের শিক্ষকদের গাইডেন্স ছাড়া আমার পক্ষে BUET-এ চান্স পাওয়া সম্ভব ছিল না। তাদের পরিশ্রম ও আন্তরিকতা অসাধারণ।', result: 'Merit Position: 45' },
        { name: 'ফাতিমা খান', achievement: 'Dhaka Medical', year: '2024', testimonial: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতি নেওয়ার জন্য প্যারাগন সেরা জায়গা। এখানকার পড়াশোনার মান অনন্য।', result: 'Merit Position: 128' },
        { name: 'করিম সাহেব', achievement: 'Engineering', year: '2024', testimonial: 'অনলাইনে ক্লাস করেও ভালো রেজাল্ট করা সম্ভব - প্যারাগন এটি প্রমাণ করেছে।', result: 'Merit Position: 89' },
        { name: 'সোনিয়া আক্তার', achievement: 'DU Ka Unit', year: '2025', testimonial: 'ঢাকা বিশ্ববিদ্যালয়ে চান্স পাওয়ার জন্য প্যারাগনের কোনো বিকল্প নেই।', result: 'Merit Position: 156' }
    ]

    const defaultFaculty = [
        { name: 'Dr. Mohammad Ali', subject: 'Physics', experience: '15+ Years Experience' },
        { name: 'Prof. Fatema Begum', subject: 'Chemistry', experience: '12+ Years Experience' },
        { name: 'Md. Abdul Karim', subject: 'Mathematics', experience: '10+ Years Experience' },
        { name: 'Dr. Nusrat Jahan', subject: 'Biology', experience: '8+ Years Experience' }
    ]

    const stats = hero.stats || defaultStats
    const courses = programs.list || defaultCourses
    const featureList = features.list || defaultFeatures
    const testimonials = success.list || defaultTestimonials

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn bg-white">
            <ScrollProgress />
            <BackToTop />

            {/* ===== ADVANCED 3D HERO SECTION ===== */}
            <HeroSection3D
                content={hero}
                stats={stats}
            />

            {/* ===== STATS SECTION ===== */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="section-title-modern reveal">
                        <span className="subtitle">
                            <TrendingUp size={16} />
                            আমাদের সাফল্য
                        </span>
                        <h2 className="title font-bangla">
                            সংখ্যায় <span className="title-highlight">প্যারাগন</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {stats.map((stat, index) => (
                            <StatCardModern
                                key={index}
                                value={stat.value}
                                suffix={stat.suffix || '+'}
                                label={stat.label}
                                icon={[Users, GraduationCap, Award, Trophy][index] || Star}
                                delay={index * 100}
                                progress={stat.progress || 75}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== ABOUT SECTION WITH GALLERY ===== */}
            <section className="py-16 md:py-24 section-alt">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="reveal-left">
                            <span className="text-[var(--secondary)] font-bold text-sm uppercase tracking-wider mb-2 inline-block">আমাদের সম্পর্কে</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--dark)] mb-6 leading-tight font-bangla">
                                স্বপ্ন পূরণের <span className="gradient-text-blue">বিশ্বস্ত সঙ্গী</span>
                            </h2>
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed font-bangla">
                                {about.description || 'প্যারাগন কোচিং সেন্টার বাংলাদেশের অন্যতম শীর্ষস্থানীয় শিক্ষা প্রতিষ্ঠান। গত এক দশকেরও বেশি সময় ধরে আমরা শিক্ষার্থীদের সাফল্যের পথে এগিয়ে নিয়ে যাচ্ছি।'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="card-stat p-4 text-center">
                                    <Building2 className="w-8 h-8 text-[var(--primary)] mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-[var(--dark)]">5+</p>
                                    <p className="text-gray-500 text-sm font-bangla">শাখা</p>
                                </div>
                                <div className="card-stat p-4 text-center">
                                    <Globe className="w-8 h-8 text-[var(--primary)] mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-[var(--dark)]">Online</p>
                                    <p className="text-gray-500 text-sm font-bangla">প্ল্যাটফর্ম</p>
                                </div>
                            </div>

                            <Link to="/stories" className="btn btn-primary font-bangla">
                                সাফল্যের গল্প দেখুন
                                <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="reveal-right">
                            <GallerySection />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== COURSES SECTION ===== */}
            <section id="programs" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="section-title-modern reveal">
                        <span className="subtitle">
                            <BookOpen size={16} />
                            Current Playlist
                        </span>
                        <h2 className="title font-bangla">
                            আমাদের <span className="title-highlight">প্রোগ্রামসমূহ</span>
                        </h2>
                        <p className="description font-bangla">
                            আপনার লক্ষ্য অনুযায়ী সেরা প্রোগ্রাম নির্বাচন করুন
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, index) => (
                            <CourseCardModern key={index} course={course} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section id="features" className="py-16 md:py-24 section-alt">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="section-title-modern reveal">
                        <span className="subtitle">
                            <Sparkles size={16} />
                            FAV Features
                        </span>
                        <h2 className="title font-bangla">
                            কেন <span className="title-highlight">প্যারাগন?</span>
                        </h2>
                        <p className="description font-bangla">
                            সেরা শিক্ষা অভিজ্ঞতার জন্য আমরা যা প্রদান করি
                        </p>
                    </div>

                    <div className="bento-grid">
                        {featureList.map((feature, index) => (
                            <FeatureCardModern key={index} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>



            {/* ===== TESTIMONIALS SECTION ===== */}
            <section className="py-16 md:py-24 bg-gradient-to-br from-[var(--primary)] via-[#1a5276] to-[#0d3b66]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="section-title-modern reveal text-white">
                        <span className="subtitle" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                            <MessageCircle size={16} />
                            My Tweets
                        </span>
                        <h2 className="title text-white font-bangla">
                            সফল শিক্ষার্থীদের <span style={{ color: 'var(--secondary)' }}>মতামত</span>
                        </h2>
                        <p className="description text-white/70 font-bangla">
                            {success.description || 'আমাদের সফল শিক্ষার্থীদের অনুপ্রেরণামূলক গল্প'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.slice(0, 4).map((testimonial, index) => (
                            <TestimonialTweet key={index} testimonial={testimonial} index={index} />
                        ))}
                    </div>

                    <div className="mt-10 text-center reveal">
                        <Link to="/stories" className="btn btn-outline-white px-8 py-3 font-bangla">
                            সব গল্প দেখুন
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== FACULTY SECTION ===== */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="section-title-modern reveal">
                        <span className="subtitle">
                            <Users size={16} />
                            Our Team
                        </span>
                        <h2 className="title font-bangla">
                            আমাদের <span className="title-highlight">শিক্ষকমণ্ডলী</span>
                        </h2>
                        <p className="description font-bangla">
                            অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকদের সাথে পরিচিত হোন
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {defaultFaculty.map((faculty, index) => (
                            <FacultyCard key={index} faculty={faculty} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="cta-section-modern">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="cta-content reveal">
                        <h2 className="cta-title font-bangla">
                            আজই শুরু করুন আপনার সফলতার যাত্রা
                        </h2>
                        <p className="cta-description font-bangla">
                            বিনামূল্যে ট্রায়াল ক্লাসে যোগ দিন এবং আমাদের শিক্ষা পদ্ধতি সম্পর্কে জানুন
                        </p>
                        <div className="cta-buttons">
                            <a href="#contact" className="btn-hero-primary font-bangla">
                                এখনই ভর্তি হন
                                <ArrowRight size={20} />
                            </a>
                            <a href="tel:09666775566" className="btn-hero-secondary font-bangla">
                                <Phone size={20} />
                                কল করুন
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONTACT SECTION ===== */}
            <section id="contact" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="reveal-left">
                            <span className="text-[var(--secondary)] font-bold text-sm uppercase tracking-wider mb-2 inline-block">যোগাযোগ করুন</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--dark)] mb-6 leading-tight font-bangla">
                                আজই শুরু করুন আপনার সফলতার যাত্রা
                            </h2>
                            <p className="text-gray-500 text-lg mb-8 font-bangla">
                                বিনামূল্যে ট্রায়াল ক্লাসে যোগ দিন এবং আমাদের শিক্ষা পদ্ধতি সম্পর্কে জানুন।
                            </p>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fbff] border border-[#e8f4fc]">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Helpline</p>
                                        <p className="text-[var(--dark)] font-bold text-lg">{contactInfo.phone || '09666775566'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fbff] border border-[#e8f4fc]">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[var(--accent)] flex items-center justify-center text-white">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Address</p>
                                        <p className="text-[var(--dark)] font-medium font-bangla">{contactInfo.address || 'ঢাকা, বাংলাদেশ'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fbff] border border-[#e8f4fc]">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--success)] to-[#2ecc71] flex items-center justify-center text-white">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Email</p>
                                        <p className="text-[var(--dark)] font-medium">{contactInfo.email || 'info@paragon.edu.bd'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="reveal-right">
                            <div className="card p-6 md:p-8 shadow-xl border-t-4 border-[var(--primary)]">
                                <h3 className="text-xl md:text-2xl font-bold text-[var(--dark)] mb-6 font-bangla">ফ্রি ক্লাস বুক করুন</h3>

                                <form className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 font-bangla">নাম</label>
                                            <input type="text" className="input" placeholder="আপনার নাম" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 font-bangla">ফোন</label>
                                            <input type="tel" className="input" placeholder="০১XXXXXXXXX" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 font-bangla">ক্লাস</label>
                                        <select className="input">
                                            <option value="">ক্লাস নির্বাচন করুন</option>
                                            <option value="9">৯ম শ্রেণী</option>
                                            <option value="10">১০ম শ্রেণী</option>
                                            <option value="11">একাদশ শ্রেণী</option>
                                            <option value="12">দ্বাদশ শ্রেণী</option>
                                            <option value="admission">ভর্তি পরীক্ষার্থী</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full py-4 text-lg font-bangla">
                                        ফ্রি ক্লাস বুক করুন
                                        <ArrowRight size={20} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="footer-modern">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <Link to="/" className="logo">
                                <GraduationCap size={32} />
                                <span>PARAGON</span>
                            </Link>
                            <p className="tagline font-bangla">
                                শিক্ষায় শ্রেষ্ঠত্ব অর্জনের বিশ্বস্ত সঙ্গী। আমাদের মিশন হলো প্রতিটি শিক্ষার্থীকে তার স্বপ্ন পূরণে সহায়তা করা।
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link" aria-label="Facebook">
                                    <Facebook size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="Instagram">
                                    <Instagram size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="Youtube">
                                    <Youtube size={20} />
                                </a>
                                <a href="#" className="social-link" aria-label="Twitter">
                                    <Twitter size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="footer-heading">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="#programs">Courses</a></li>
                                <li><a href="#features">Features</a></li>
                                <li><Link to="/stories">Success Stories</Link></li>
                                <li><a href="#contact">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="footer-heading">Programs</h4>
                            <ul className="footer-links">
                                <li><a href="#">Medical Admission</a></li>
                                <li><a href="#">Engineering</a></li>
                                <li><a href="#">University</a></li>
                                <li><a href="#">HSC/SSC</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="footer-heading">Contact</h4>
                            <ul className="footer-links">
                                <li>
                                    <a href={`tel:${contactInfo.phone || '09666775566'}`}>
                                        <Phone size={16} />
                                        {contactInfo.phone || '09666775566'}
                                    </a>
                                </li>
                                <li>
                                    <a href={`mailto:${contactInfo.email || 'info@paragon.edu.bd'}`}>
                                        <Mail size={16} />
                                        {contactInfo.email || 'info@paragon.edu.bd'}
                                    </a>
                                </li>
                                <li>
                                    <a href="#">
                                        <MapPin size={16} />
                                        <span className="font-bangla">{contactInfo.address || 'ঢাকা, বাংলাদেশ'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 PARAGON Coaching Center. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
