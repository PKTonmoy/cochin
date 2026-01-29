import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const SuccessStoriesPage = () => {
    const [content, setContent] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        window.scrollTo(0, 0)
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

    const success = content.success?.content || {}
    // Ensure we use the 'list' key as per recent fixes
    const stories = success.list || []

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Header */}
            <div className="bg-[var(--primary)] text-white py-16 mb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link to="/" className="inline-flex items-center text-blue-200 hover:text-white transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Home
                        </Link>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {success.heading || 'Success Stories'}
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl">
                        {success.description || 'Celebrating the achievements of our outstanding students.'}
                    </p>
                </div>
            </div>

            {/* Stories Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {stories.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No success stories added yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stories.map((student, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                                        {student.image ? (
                                            <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xl font-bold text-[var(--primary)]">
                                                {student.name?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                                        <p className="text-[var(--primary)] font-medium text-sm">{student.achievement}</p>
                                        <span className="inline-block mt-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                            {student.year}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute -top-2 -left-2 text-4xl text-gray-200 font-serif">"</span>
                                    <p className="text-gray-600 italic leading-relaxed text-sm relative z-10 pl-2">
                                        {student.testimonial}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SuccessStoriesPage
