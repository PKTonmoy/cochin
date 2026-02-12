import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useSettings } from '../../contexts/SettingsContext'
import StoryCarousel from '../../components/testimonials/StoryCarousel'
import VictoryCard from '../../components/cards/VictoryCard'
import Footer from '../../components/layout/Footer'
import VictoryCardSkeleton from '../../components/skeletons/VictoryCardSkeleton'
import TestimonialCardSkeleton from '../../components/skeletons/TestimonialCardSkeleton'
import {
    Trophy, MessageCircle, ArrowUp, ArrowRight, Phone
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

const SuccessStoriesPage = () => {
    const { getPrimaryPhone } = useSettings()
    const [content, setContent] = useState({})
    const [toppers, setToppers] = useState([])
    const [loading, setLoading] = useState(true)
    const [storyOpen, setStoryOpen] = useState(false)
    const [storyIndex, setStoryIndex] = useState(0)

    useEffect(() => {
        window.scrollTo(0, 0)
        const fetchContent = async () => {
            try {
                // Fetch both site content and toppers in parallel
                const [contentRes, toppersRes] = await Promise.all([
                    api.get('/site-content').catch(() => ({ data: { data: {} } })),
                    api.get('/toppers/public').catch(() => ({ data: { data: [] } }))
                ])
                setContent(contentRes.data.data || {})
                setToppers(toppersRes.data.data || [])
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

    const success = content.success?.content || {}

    // Map API toppers to display format or use fallback
    const stories = toppers.length > 0
        ? toppers.map(topper => ({
            name: topper.studentName || topper.name,           // Fixed: use studentName
            achievement: topper.examName || topper.exam || topper.achievement,
            year: topper.year?.toString() || '2024',
            testimonial: topper.successStory || topper.testimonial || topper.quote || '',
            result: topper.rank || (topper.score ? `Score: ${topper.score}` : ''),
            image: topper.photo?.url || topper.photo || topper.image,          // Fixed: access photo.url
            institution: topper.institution,
            section: topper.section
        }))
        : [
            { name: 'রহিম আহমেদ', achievement: 'BUET CSE', year: '2024', testimonial: 'প্যারাগনের শিক্ষকদের গাইডেন্স ছাড়া আমার পক্ষে BUET-এ চান্স পাওয়া সম্ভব ছিল না।', result: 'Merit: 45' },
            { name: 'ফাতিমা খান', achievement: 'Dhaka Medical', year: '2024', testimonial: 'মেডিকেল ভর্তি পরীক্ষার প্রস্তুতি নেওয়ার জন্য প্যারাগন সেরা জায়গা।', result: 'Merit: 128' },
            { name: 'করিম হাসান', achievement: 'Engineering', year: '2024', testimonial: 'অনলাইনে ক্লাস করেও ভালো রেজাল্ট করা সম্ভব - প্যারাগন প্রমাণ করেছে।', result: 'Merit: 89' },
            { name: 'সোনিয়া আক্তার', achievement: 'DU Ka Unit', year: '2025', testimonial: 'ঢাকা বিশ্ববিদ্যালয়ে চান্স পাওয়ার জন্য প্যারাগনের বিকল্প নেই।', result: 'Merit: 156' },
            { name: 'শাহরিয়ার হোসেন', achievement: 'RUET EEE', year: '2024', testimonial: 'রুয়েটে ইইই-তে চান্স পেয়েছি প্যারাগনের শিক্ষকদের কাছ থেকে।', result: 'Merit: 234' },
            { name: 'তাসনিম জাহান', achievement: 'Chittagong Medical', year: '2024', testimonial: 'চট্টগ্রাম মেডিকেলে চান্স পেয়ে গর্বিত। ধন্যবাদ প্যারাগন!', result: 'Merit: 312' }
        ]

    const topRankers = stories.slice(0, 3).map((t, i) => ({
        name: t.name,
        achievement: t.achievement,
        score: t.result || `AIR ${(i + 1) * 15}`,
        image: t.image,
        institution: t.institution || t.achievement,
        testimonial: t.testimonial,
        year: t.year,
        section: t.section
    }))

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                {/* Hero Skeleton - mimicking the gradient header */}
                <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-500 to-orange-500 overflow-hidden">
                    <div className="container-cyber relative z-10 text-center">
                        <div className="mx-auto bg-white/20 w-32 h-8 rounded-full mb-6"></div>
                        <div className="mx-auto bg-white/20 h-16 w-3/4 max-w-2xl text-white mb-6 rounded-xl"></div>
                        <div className="mx-auto bg-white/20 h-6 w-1/2 max-w-xl text-white/80 rounded.lg"></div>
                    </div>
                </section>

                {/* Top Rankers Skeleton */}
                <section className="section-cyber bg-white -mt-12 relative z-10">
                    <div className="container-cyber">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <VictoryCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Stories Skeleton */}
                <section className="section-cyber bg-gray-50">
                    <div className="container-cyber">
                        <div className="section-title">
                            <div className="mx-auto bg-gray-200 h-8 w-40 rounded-full mb-4"></div>
                            <div className="mx-auto bg-gray-200 h-10 w-64 rounded-xl mb-2"></div>
                            <div className="mx-auto bg-gray-200 h-4 w-48 rounded-lg"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <TestimonialCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <BackToTop />

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
                            <Trophy size={16} />
                            <span>Hall of Fame</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-bangla">
                            আমাদের <span className="text-orange-300">সফল শিক্ষার্থী</span>
                        </h1>
                        <p className="text-xl text-white/80 font-bangla">
                            {success.description || 'প্যারাগনের গর্বিত শিক্ষার্থীদের সাফল্যের গল্প'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Top Rankers */}
            {topRankers.length > 0 && (
                <section className="section-cyber bg-white -mt-12 relative z-10">
                    <div className="container-cyber">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
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
                    </div>
                </section>
            )}

            {/* All Stories */}
            <section className="section-cyber bg-gray-50">
                <div className="container-cyber">
                    <div className="section-title reveal">
                        <div className="badge">
                            <MessageCircle size={16} />
                            <span>Success Stories</span>
                        </div>
                        <h2 className="font-bangla">সফল শিক্ষার্থীদের <span className="gradient-text">মতামত</span></h2>
                        <p className="font-bangla">যারা প্যারাগনের সাথে তাদের স্বপ্ন পূরণ করেছে</p>
                    </div>

                    {stories.length === 0 ? (
                        <div className="text-center py-20 reveal">
                            <p className="text-gray-500 text-lg font-bangla">এখনো কোন সফলতার গল্প যোগ করা হয়নি।</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map((student, index) => (
                                <div
                                    key={index}
                                    className="glass-card p-6 reveal cursor-pointer hover:shadow-xl transition-all"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => { setStoryIndex(index); setStoryOpen(true) }}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-100 shadow-md">
                                            {student.image ? (
                                                <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white">
                                                    {student.name?.charAt(0) || 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 font-bangla">{student.name}</h3>
                                            <p className="text-blue-600 font-medium text-sm">{student.achievement}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-block bg-gradient-to-r from-blue-50 to-orange-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium">
                                                    {student.year}
                                                </span>
                                                {student.section && (
                                                    <span className="inline-block bg-gradient-to-r from-orange-50 to-blue-50 text-orange-600 text-xs px-2 py-1 rounded-full font-semibold">
                                                        Unit {student.section}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {student.testimonial && (
                                        <div className="relative pt-2">
                                            <span className="absolute -top-1 left-0 text-4xl text-blue-200 font-serif">"</span>
                                            <p className="text-gray-600 text-sm leading-relaxed pl-4 font-bangla italic line-clamp-3">
                                                {student.testimonial}
                                            </p>
                                        </div>
                                    )}
                                    {student.result && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-sm text-gray-500">Result: </span>
                                                <span className="text-sm font-semibold text-orange-500">{student.result}</span>
                                            </div>
                                            <span className="text-blue-500 text-sm">Click to read →</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <StoryCarousel testimonials={stories} isOpen={storyOpen} onClose={() => setStoryOpen(false)} startIndex={storyIndex} />

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-500 via-blue-600 to-orange-500 relative overflow-hidden">
                <div className="container-cyber text-center relative z-10 reveal">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-bangla">
                        আপনিও হতে পারেন পরবর্তী সফল শিক্ষার্থী
                    </h2>
                    <p className="text-white/80 mb-8 font-bangla">আজই শুরু করুন আপনার সফলতার যাত্রা</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/#contact" className="btn-cyber bg-white text-blue-600 shadow-xl hover:shadow-2xl">
                            <span className="font-bangla">এখনই ভর্তি হন</span>
                            <ArrowRight size={20} />
                        </Link>
                        <a href={`tel:${getPrimaryPhone()}`} className="btn-glass bg-white/20 text-white border-white/30">
                            <Phone size={20} />
                            <span>কল করুন</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}

export default SuccessStoriesPage
