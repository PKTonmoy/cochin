import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useSettings } from '../../contexts/SettingsContext'
import { HeroSection3D } from '../../components/hero'
import FloatingNav from '../../components/navigation/FloatingNav'
import HolographicStatCard from '../../components/cards/HolographicStatCard'
import CourseCarousel from '../../components/carousel/CourseCarousel'
import VictoryCard from '../../components/cards/VictoryCard'
import StoryCarousel, { StoryPreviews } from '../../components/testimonials/StoryCarousel'
import Footer from '../../components/layout/Footer'
import {
    Users, GraduationCap, Award, Trophy, BookOpen, ArrowRight, Phone, Mail, MapPin,
    MessageCircle, Sparkles, TrendingUp, Target, Clock, ArrowUp
} from 'lucide-react'

// Scroll Progress
function ScrollProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const total = document.documentElement.scrollHeight - window.innerHeight
            setProgress((window.scrollY / total) * 100)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="scroll-progress">
            <div className="scroll-progress-bar" style={{ width: `${progress}%` }} />
        </div>
    )
}

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

// Feature Card
function FeatureCard({ feature, index }) {
    const icons = { monitor: Target, users: Users, book: BookOpen, target: Target, clock: Clock, trophy: Trophy }
    const Icon = icons[feature.icon] || Sparkles

    return (
        <div className="glass-card p-6 reveal" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <Icon size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900 font-bangla">{feature.title}</h3>
            <p className="text-gray-500 text-sm font-bangla">{feature.description}</p>
        </div>
    )
}

// Faculty Card
function FacultyCard({ faculty, index }) {
    return (
        <div className="glass-card p-6 text-center reveal group" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden group-hover:scale-110 transition-transform shadow-lg ring-4 ring-blue-50">
                {faculty.image ? (
                    <img
                        src={faculty.image}
                        alt={faculty.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-3xl font-bold text-white">
                        {faculty.name?.charAt(0) || 'T'}
                    </div>
                )}
            </div>
            <h3 className="font-bold text-lg text-gray-900 font-bangla">{faculty.name}</h3>
            <p className="text-orange-500 text-sm font-bangla">{faculty.subject}</p>
            <p className="text-gray-400 text-xs mt-1">{faculty.experience}</p>
        </div>
    )
}

// Main Component
export default function LandingPage() {
    const { getPrimaryPhone, getEmail, getAddress } = useSettings()
    const [content, setContent] = useState({})
    const [courses, setCourses] = useState([])
    const [faculty, setFaculty] = useState([])
    const [toppers, setToppers] = useState([])
    const [testimonialData, setTestimonialData] = useState([])
    const [loading, setLoading] = useState(true)
    const [storyOpen, setStoryOpen] = useState(false)
    const [storyIndex, setStoryIndex] = useState(0)
    const [leadName, setLeadName] = useState('')
    const [leadPhone, setLeadPhone] = useState('')
    const [leadClass, setLeadClass] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleLeadSubmit = async (e) => {
        e.preventDefault()
        if (!leadName || !leadPhone) {
            alert('Please fill in Name and Phone')
            return
        }

        try {
            setSubmitting(true)
            await api.post('/leads', {
                name: leadName,
                phone: leadPhone,
                class: leadClass
            })
            alert('Thank you! We will contact you soon.')
            setLeadName('')
            setLeadPhone('')
            setLeadClass('')
        } catch (error) {
            console.error('Lead submission failed:', error)
            alert('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [contentRes, coursesRes, facultyRes, toppersRes, testimonialsRes] = await Promise.all([
                    api.get('/site-content').catch(() => ({ data: { data: {} } })),
                    api.get('/courses/public?showOnHomepage=true').catch(() => ({ data: { data: [] } })),
                    api.get('/faculty/public').catch(() => ({ data: { data: [] } })),
                    api.get('/toppers/public/homepage').catch(() => ({ data: { data: [] } })),
                    api.get('/testimonials/public/homepage').catch(() => ({ data: { data: [] } }))
                ])

                setContent(contentRes.data.data || {})
                setCourses(coursesRes.data.data || [])
                setFaculty(facultyRes.data.data || [])
                setToppers(toppersRes.data.data || [])
                setTestimonialData(testimonialsRes.data.data || [])
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
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

    // Data
    const hero = content.hero?.content || {}
    const stats = hero.stats || [
        { label: 'Students', value: '1000', suffix: '+' },
        { label: 'Teachers', value: '50', suffix: '+' },
        { label: 'Years', value: '10', suffix: '+' },
        { label: 'Success', value: '95', suffix: '%' }
    ]

    // Map API courses to display format (use fetched data or fallback)
    const displayCourses = courses.length > 0
        ? courses.map(course => ({
            title: course.name || course.title,
            description: course.shortDescription || course.description,
            badge: course.featured ? 'Popular' : (course.badge || ''),
            type: course.category?.toLowerCase() || 'default',
            features: course.features || [],
            studyMaterials: course.studyMaterials?.map(m =>
                m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
            ) || [],
            rating: course.rating || 4.9,
            image: course.image?.url || course.image || course.thumbnail,   // Fixed: access image.url
            price: course.price,
            discountPrice: course.discountPrice,
            duration: course.duration,
            totalSeats: course.totalSeats,
            classSchedule: course.classSchedule,
            mode: course.mode,
            pricing: course.pricing
        }))
        : [
            { title: 'Medical Admission 2026', description: 'মেডিকেল ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি', badge: 'Popular', type: 'medical', features: ['মেধাবী শিক্ষক', 'লাইভ ক্লাস'] },
            { title: 'Engineering Admission', description: 'ইঞ্জিনিয়ারিং ভর্তির জন্য প্রস্তুতি', badge: 'New', type: 'engineering', features: ['BUET ফোকাস', 'মডেল টেস্ট'] },
            { title: 'HSC Academic', description: 'একাদশ-দ্বাদশ শ্রেণীর প্রোগ্রাম', type: 'hsc', features: ['বোর্ড প্রস্তুতি'] },
            { title: 'DU Admission', description: 'ঢাকা বিশ্ববিদ্যালয় ক্র্যাশ কোর্স', badge: 'Hot', type: 'university', features: ['Ka/Kha Unit'] },
        ]

    // Map API testimonials to display format (prioritize Testimonials API, fallback to toppers)
    const testimonials = testimonialData.length > 0
        ? testimonialData.map(t => ({
            name: t.studentName || t.name,
            achievement: t.achievement || t.courseName || '',
            year: t.year?.toString() || '2024',
            testimonial: t.quote || t.shortQuote || '',
            result: t.achievement || '',
            image: t.photo?.url || t.image,
            rating: t.rating || 5,
            institution: t.achievement
        }))
        : toppers.length > 0
            ? toppers.map(topper => ({
                name: topper.studentName || topper.name,
                achievement: topper.examName || topper.exam || topper.achievement,
                year: topper.year?.toString() || '2024',
                testimonial: topper.successStory || topper.testimonial || topper.quote || '',
                result: topper.rank || (topper.score ? `Score: ${topper.score}` : ''),
                image: topper.photo?.url || topper.image,
                institution: topper.institution
            }))
            : [
                { name: 'রহিম আহমেদ', achievement: 'BUET CSE', year: '2024', testimonial: 'প্যারাগনের শিক্ষকদের গাইডেন্স ছাড়া আমার পক্ষে BUET-এ চান্স পাওয়া সম্ভব ছিল না।', result: 'Merit: 45' },
                { name: 'ফাতিমা খান', achievement: 'Dhaka Medical', year: '2024', testimonial: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতি নেওয়ার জন্য প্যারাগন সেরা জায়গা।', result: 'Merit: 128' },
                { name: 'করিম হাসান', achievement: 'Engineering', year: '2024', testimonial: 'অনলাইনে ক্লাস করেও ভালো রেজাল্ট করা সম্ভব - প্যারাগন প্রমাণ করেছে।', result: 'Merit: 89' },
                { name: 'সোনিয়া আক্তার', achievement: 'DU Ka Unit', year: '2025', testimonial: 'ঢাকা বিশ্ববিদ্যালয়ে চান্স পাওয়ার জন্য প্যারাগনের বিকল্প নেই।', result: 'Merit: 156' }
            ]

    const features = content.features?.content?.list || [
        { title: 'অফলাইন/অনলাইন', description: 'যেকোনো জায়গা থেকে শিখুন', icon: 'monitor' },
        { title: 'মেধাবী শিক্ষক', description: 'দেশসেরা শিক্ষকদের কাছ থেকে শিখুন', icon: 'users' },
        { title: 'স্টাডি ম্যাটেরিয়ালস', description: 'আপডেটেড শিক্ষা উপকরণ', icon: 'book' },
        { title: 'এক্সাম সিস্টেম', description: 'নিয়মিত পরীক্ষা ও মূল্যায়ন', icon: 'target' },
    ]

    // Map API faculty to display format
    const displayFaculty = faculty.length > 0
        ? faculty.map(f => ({
            name: f.name,
            subject: f.subjects?.[0]?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || f.designation || 'Faculty',
            experience: f.experience?.totalYears ? `${f.experience.totalYears}+ Years` : '5+ Years',
            image: f.photo?.url || f.photo || f.image              // Fixed: access photo.url
        }))
        : [
            { name: 'Dr. Mohammad Ali', subject: 'Physics', experience: '15+ Years' },
            { name: 'Prof. Fatema Begum', subject: 'Chemistry', experience: '12+ Years' },
            { name: 'Md. Abdul Karim', subject: 'Mathematics', experience: '10+ Years' },
            { name: 'Dr. Nusrat Jahan', subject: 'Biology', experience: '8+ Years' }
        ]

    // Top Rankers for Victory Cards - use Toppers API data directly
    const topRankers = toppers.length > 0
        ? toppers.slice(0, 3).map((topper, i) => ({
            name: topper.studentName || topper.name,
            achievement: topper.examName || topper.exam || topper.achievement,
            score: topper.rank || (topper.score ? `Score: ${topper.score}` : `AIR ${(i + 1) * 15}`),
            percentile: `${99.9 - i * 0.1}%`,
            image: topper.photo?.url || topper.image,
            institution: topper.institution || topper.examName || topper.achievement,
            testimonial: topper.successStory || topper.testimonial || topper.quote || '',
            year: topper.year?.toString() || '2024',
            section: topper.section
        }))
        : testimonials.slice(0, 3).map((t, i) => ({
            name: t.name,
            achievement: t.achievement,
            score: t.result || `AIR ${(i + 1) * 15}`,
            percentile: `${99.9 - i * 0.1}%`,
            image: t.image,
            institution: t.institution || t.achievement,
            testimonial: t.testimonial,
            year: t.year
        }))

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <ScrollProgress />
            <BackToTop />
            <FloatingNav />

            {/* Hero */}
            <HeroSection3D content={hero} stats={stats} />

            {/* Courses */}
            <section id="programs" className="section-cyber relative" style={{
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 40%, #f8fafc 100%)'
            }}>
                {/* Decorative background elements */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
                    background: 'radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.04) 0%, transparent 50%), radial-gradient(circle at 85% 50%, rgba(249, 115, 22, 0.04) 0%, transparent 50%)',
                    zIndex: 0
                }} />
                <div className="container-cyber relative" style={{ zIndex: 1 }}>
                    <div className="section-title reveal">
                        <div className="badge">
                            <BookOpen size={16} />
                            <span>Our Programs</span>
                        </div>
                        <h2 className="font-bangla">আমাদের <span className="gradient-text">প্রোগ্রামসমূহ</span></h2>
                        <p className="font-bangla">আপনার লক্ষ্য অনুযায়ী সেরা প্রোগ্রাম নির্বাচন করুন</p>
                    </div>
                    <CourseCarousel courses={displayCourses} />
                </div>
            </section>

            {/* Features */}
            <section className="section-cyber bg-white">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <Sparkles size={16} />
                            <span>Why Choose Us</span>
                        </div>
                        <h2 className="font-bangla">কেন <span className="gradient-text">প্যারাগন?</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="section-cyber bg-gradient-to-b from-blue-50 to-white">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <Trophy size={16} />
                            <span>Hall of Fame</span>
                        </div>
                        <h2 className="font-bangla">আমাদের <span className="gradient-text">সফল শিক্ষার্থী</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topRankers.map((s, i) => (
                            <VictoryCard
                                key={i}
                                student={s}
                                rank={i + 1}
                                index={i}
                                onViewStory={(idx) => { setStoryIndex(idx); setStoryOpen(true) }}
                            />
                        ))}
                    </div>
                    <div className="text-center mt-8 reveal">
                        <Link to="/stories" className="btn-glass">
                            সব গল্প দেখুন <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section-cyber bg-white">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <MessageCircle size={16} />
                            <span>Success Stories</span>
                        </div>
                        <h2 className="font-bangla">সফল শিক্ষার্থীদের <span className="gradient-text">মতামত</span></h2>
                    </div>
                    <div className="reveal">
                        <StoryPreviews testimonials={testimonials} onOpen={(i) => { setStoryIndex(i); setStoryOpen(true) }} />
                    </div>
                </div>
            </section>

            <StoryCarousel testimonials={testimonials} isOpen={storyOpen} onClose={() => setStoryOpen(false)} startIndex={storyIndex} />

            {/* Faculty */}
            <section className="section-cyber bg-gray-50">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <Users size={16} />
                            <span>Our Team</span>
                        </div>
                        <h2 className="font-bangla">আমাদের <span className="gradient-text">শিক্ষকমণ্ডলী</span></h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {displayFaculty.map((f, i) => <FacultyCard key={i} faculty={f} index={i} />)}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-500 via-blue-600 to-orange-500 relative overflow-hidden">
                <div className="container-cyber text-center relative z-10 reveal">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-bangla">
                        আজই শুরু করুন আপনার সফলতার যাত্রা
                    </h2>
                    <p className="text-white/80 mb-8 font-bangla">বিনামূল্যে ট্রায়াল ক্লাসে যোগ দিন</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#contact" className="btn-cyber bg-white text-blue-600 shadow-xl hover:shadow-2xl">
                            <span className="font-bangla">এখনই ভর্তি হন</span>
                            <ArrowRight size={20} />
                        </a>
                        <a href={`tel:${getPrimaryPhone()}`} className="btn-glass bg-white/20 text-white border-white/30">
                            <Phone size={20} />
                            <span>কল করুন</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="section-cyber bg-white">
                <div className="container-cyber">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="reveal">
                            <span className="text-orange-500 text-sm font-semibold uppercase tracking-wider">যোগাযোগ</span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-gray-900 font-bangla">
                                আজই <span className="gradient-text">শুরু করুন</span>
                            </h2>

                            <div className="space-y-4">
                                {[
                                    { icon: Phone, label: 'Helpline', value: getPrimaryPhone() },
                                    { icon: MapPin, label: 'Address', value: getAddress() },
                                    { icon: Mail, label: 'Email', value: getEmail() }
                                ].map((item, i) => (
                                    <div key={i} className="glass-card p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-md">
                                            <item.icon size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">{item.label}</p>
                                            <p className="font-semibold text-gray-900 font-bangla">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="reveal">
                            <div className="glass-card p-6 md:p-8">
                                <h3 className="text-xl font-bold mb-6 text-gray-900 font-bangla">ফ্রি ক্লাস বুক করুন</h3>
                                <form className="space-y-4" onSubmit={handleLeadSubmit}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="আপনার নাম"
                                            className="input-cyber"
                                            value={leadName}
                                            onChange={(e) => setLeadName(e.target.value)}
                                            required
                                        />
                                        <input
                                            type="tel"
                                            placeholder="ফোন"
                                            className="input-cyber"
                                            value={leadPhone}
                                            onChange={(e) => setLeadPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <select
                                        className="input-cyber"
                                        value={leadClass}
                                        onChange={(e) => setLeadClass(e.target.value)}
                                    >
                                        <option value="">ক্লাস নির্বাচন করুন</option>
                                        <option value="9">৯ম শ্রেণী</option>
                                        <option value="10">১০ম শ্রেণী</option>
                                        <option value="11">একাদশ</option>
                                        <option value="Examinee">ভর্তি পরীক্ষার্থী</option>
                                    </select>
                                    <button type="submit" className="btn-cyber w-full py-4" disabled={submitting}>
                                        <span className="font-bangla">{submitting ? 'Submitting...' : 'বুক করুন'}</span>
                                        <ArrowRight size={20} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}
