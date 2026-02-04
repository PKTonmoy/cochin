import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import FloatingNav from '../../components/navigation/FloatingNav'
import CourseCarousel from '../../components/carousel/CourseCarousel'
import {
    BookOpen, ArrowUp, ArrowRight, GraduationCap, Heart, Zap, Target,
    Facebook, Instagram, Youtube, Twitter, Phone, Mail, MapPin,
    Clock, Users, CheckCircle, Star
} from 'lucide-react'

// Back to Top
function BackToTop() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 500)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <button
            className={`back-to-top ${visible ? 'visible' : ''}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
            <ArrowUp size={20} />
        </button>
    )
}

// Program Detail Card
function ProgramDetailCard({ program, index }) {
    const icons = {
        medical: Heart,
        engineering: Zap,
        hsc: BookOpen,
        ssc: BookOpen,
        university: GraduationCap,
        default: Target
    }
    const Icon = icons[program.type] || icons.default

    const colors = {
        medical: 'from-red-500 to-pink-500',
        engineering: 'from-blue-500 to-cyan-500',
        hsc: 'from-green-500 to-emerald-500',
        university: 'from-purple-500 to-indigo-500',
        default: 'from-blue-500 to-orange-500'
    }
    const gradientClass = colors[program.type] || colors.default

    return (
        <div className="glass-card overflow-hidden reveal group" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Header */}
            <div className={`h-48 bg-gradient-to-br ${gradientClass} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon size={48} className="text-white" />
                </div>
                {program.badge && (
                    <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${program.badge.toLowerCase() === 'popular' ? 'bg-green-500' :
                        program.badge.toLowerCase() === 'new' ? 'bg-purple-500' :
                            program.badge.toLowerCase() === 'hot' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                        {program.badge}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-bangla">{program.title}</h3>
                <p className="text-gray-600 text-sm mb-4 font-bangla">{program.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                    {program.features?.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="font-bangla">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                    <div className="text-center">
                        <Clock size={18} className="mx-auto text-blue-500 mb-1" />
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">6 Months</p>
                    </div>
                    <div className="text-center">
                        <Users size={18} className="mx-auto text-orange-500 mb-1" />
                        <p className="text-xs text-gray-500">Batch Size</p>
                        <p className="text-sm font-semibold text-gray-900">30</p>
                    </div>
                    <div className="text-center">
                        <Star size={18} className="mx-auto text-yellow-500 mb-1" />
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="text-sm font-semibold text-gray-900">4.9</p>
                    </div>
                </div>

                {/* CTA */}
                <button className="btn-cyber w-full mt-4 py-3 text-sm">
                    <span className="font-bangla">বিস্তারিত দেখুন</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    )
}

const ProgramsPage = () => {
    const [content, setContent] = useState({})
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        window.scrollTo(0, 0)
        const fetchContent = async () => {
            try {
                // Fetch both site content and courses in parallel
                const [contentRes, coursesRes] = await Promise.all([
                    api.get('/site-content').catch(() => ({ data: { data: {} } })),
                    api.get('/courses/public').catch(() => ({ data: { data: [] } }))
                ])
                setContent(contentRes.data.data || {})
                setCourses(coursesRes.data.data || [])
            } catch (error) {
                console.error('Failed to fetch content:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchContent()
    }, [])

    // Reveal animations
    useEffect(() => {
        if (loading) return
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
            { threshold: 0.1 }
        )
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [loading])

    // Map API courses to display format (use fetched data or fallback)
    const programs = courses.length > 0
        ? courses.map(course => ({
            title: course.name || course.title,
            description: course.shortDescription || course.description,
            badge: course.isFeatured ? 'Popular' : (course.badge || ''),
            type: course.category?.toLowerCase() || 'default',
            features: course.features || course.highlights || [],
            rating: course.rating || 4.9,
            image: course.thumbnail || course.image
        }))
        : [
            { title: 'Medical Admission 2026', description: 'মেডিকেল ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', badge: 'Popular', type: 'medical', features: ['মেধাবী শিক্ষক', 'লাইভ ক্লাস', 'মডেল টেস্ট', 'সলভ ক্লাস'] },
            { title: 'Engineering Admission', description: 'ইঞ্জিনিয়ারিং ভর্তির জন্য প্রস্তুতি', badge: 'New', type: 'engineering', features: ['BUET ফোকাস', 'মডেল টেস্ট', 'Math Special', 'Physics Special'] },
            { title: 'HSC Academic', description: 'একাদশ-দ্বাদশ শ্রেণীর প্রোগ্রাম', type: 'hsc', features: ['বোর্ড প্রস্তুতি', 'CQ Practice', 'রিভিশন ক্লাস', 'নোট শীট'] },
            { title: 'DU Admission', description: 'ঢাকা বিশ্ববিদ্যালয় ক্র্যাশ কোর্স', badge: 'Hot', type: 'university', features: ['Ka/Kha Unit', 'GK Special', 'English Focus', 'Bengali Focus'] },
        ]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <BackToTop />
            <FloatingNav />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-500 to-orange-500 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
                </div>

                <div className="container-cyber relative z-10">
                    <div className="text-center max-w-3xl mx-auto reveal">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm mb-6">
                            <BookOpen size={16} />
                            <span>Our Programs</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-bangla">
                            আমাদের <span className="text-orange-300">প্রোগ্রামসমূহ</span>
                        </h1>
                        <p className="text-xl text-white/80 font-bangla">
                            আপনার লক্ষ্য অনুযায়ী সেরা প্রোগ্রাম নির্বাচন করুন
                        </p>
                    </div>
                </div>
            </section>

            {/* Programs Carousel Preview */}
            <section className="section-cyber bg-gray-50 -mt-12 relative z-10">
                <div className="container-cyber">
                    <div className="reveal">
                        <CourseCarousel courses={programs} />
                    </div>
                </div>
            </section>

            {/* Detailed Programs */}
            <section className="section-cyber bg-white">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <h2 className="font-bangla">বিস্তারিত <span className="gradient-text">প্রোগ্রাম তথ্য</span></h2>
                        <p className="font-bangla">প্রতিটি প্রোগ্রামের বিস্তারিত জানুন</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {programs.map((program, index) => (
                            <ProgramDetailCard key={index} program={program} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Section */}
            <section className="section-cyber bg-gradient-to-b from-gray-50 to-white">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <Star size={16} />
                            <span>Why Choose Us</span>
                        </div>
                        <h2 className="font-bangla">কেন আমাদের <span className="gradient-text">প্রোগ্রাম?</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Users, title: 'অভিজ্ঞ শিক্ষক', desc: 'দেশসেরা অভিজ্ঞ শিক্ষকদের সাথে শিখুন', color: 'blue' },
                            { icon: BookOpen, title: 'আপডেটেড কারিকুলাম', desc: 'সর্বশেষ সিলেবাস অনুযায়ী তৈরি কোর্স', color: 'orange' },
                            { icon: Target, title: 'ফলাফল কেন্দ্রিক', desc: 'পরীক্ষায় সেরা ফলাফলের জন্য ডিজাইন করা', color: 'green' },
                            { icon: Clock, title: 'ফ্লেক্সিবল সময়', desc: 'আপনার সুবিধামতো ক্লাসের সময় নির্বাচন', color: 'purple' },
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-6 text-center reveal" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center mb-4 shadow-lg`}>
                                    <item.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 font-bangla">{item.title}</h3>
                                <p className="text-gray-500 text-sm font-bangla">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-500 via-blue-600 to-orange-500 relative overflow-hidden">
                <div className="container-cyber text-center relative z-10 reveal">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-bangla">
                        আজই শুরু করুন আপনার সফলতার যাত্রা
                    </h2>
                    <p className="text-white/80 mb-8 font-bangla">বিনামূল্যে ট্রায়াল ক্লাসে যোগ দিন</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/#contact" className="btn-cyber bg-white text-blue-600 shadow-xl hover:shadow-2xl">
                            <span className="font-bangla">এখনই ভর্তি হন</span>
                            <ArrowRight size={20} />
                        </Link>
                        <a href="tel:09666775566" className="btn-glass bg-white/20 text-white border-white/30">
                            <Phone size={20} />
                            <span>কল করুন</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer-cyber">
                <div className="container-cyber">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <Link to="/" className="flex items-center gap-2 text-2xl font-bold mb-4">
                                <GraduationCap size={32} className="text-blue-500" />
                                <span className="gradient-text">PARAGON</span>
                            </Link>
                            <p className="text-gray-500 text-sm font-bangla">শিক্ষায় শ্রেষ্ঠত্ব অর্জনের বিশ্বস্ত সঙ্গী</p>
                            <div className="flex gap-3 mt-4">
                                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-white hover:bg-blue-500 transition-all">
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-gray-900">Quick Links</h4>
                            <ul className="space-y-2 text-gray-500 text-sm">
                                <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
                                <li><Link to="/programs" className="hover:text-blue-500 transition-colors">Programs</Link></li>
                                <li><Link to="/stories" className="hover:text-blue-500 transition-colors">Success Stories</Link></li>
                                <li><a href="/#contact" className="hover:text-blue-500 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-gray-900">Programs</h4>
                            <ul className="space-y-2 text-gray-500 text-sm font-bangla">
                                <li>মেডিকেল এডমিশন</li>
                                <li>ইঞ্জিনিয়ারিং এডমিশন</li>
                                <li>HSC Academic</li>
                                <li>বিশ্ববিদ্যালয় ভর্তি</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-gray-900">Contact</h4>
                            <ul className="space-y-2 text-gray-500 text-sm">
                                <li className="flex items-center gap-2"><Phone size={14} /> 09666775566</li>
                                <li className="flex items-center gap-2"><Mail size={14} /> info@paragon.edu.bd</li>
                                <li className="flex items-center gap-2 font-bangla"><MapPin size={14} /> ঢাকা, বাংলাদেশ</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 text-center text-gray-400 text-sm">
                        <p>© 2026 PARAGON Coaching Center. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default ProgramsPage
