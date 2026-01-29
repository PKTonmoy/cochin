/**
 * Testimonial Block Component
 * Customer testimonials in carousel or grid layout
 */

import { Star, Quote } from 'lucide-react'

const TestimonialBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'What Our Students Say', fontSize: '32px', color: '#1f2937' },
        testimonials: [
            { name: 'Student Name', role: 'Class 10', content: 'Great coaching center!', image: { url: '' }, rating: 5 }
        ],
        layout: 'grid' // grid, carousel
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || '#f9fafb',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '60px 20px'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '1200px',
        margin: '0 auto'
    }

    const renderStars = (rating) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? '#fbbf24' : 'none'}
                color={i < rating ? '#fbbf24' : '#d1d5db'}
            />
        ))
    }

    return (
        <section className="block-testimonial" style={sectionStyle}>
            <div style={containerStyle}>
                {/* Title */}
                {c.title?.text && (
                    <h2
                        style={{
                            fontSize: c.title.fontSize,
                            color: c.title.color,
                            textAlign: 'center',
                            marginBottom: '48px'
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('title.text', e.target.innerText)}
                    >
                        {c.title.text}
                    </h2>
                )}

                {/* Testimonials Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}
                >
                    {c.testimonials?.map((testimonial, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '16px',
                                padding: '32px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                position: 'relative'
                            }}
                        >
                            {/* Quote Icon */}
                            <Quote
                                size={40}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    color: '#f3f4f6'
                                }}
                            />

                            {/* Rating */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                                {renderStars(testimonial.rating || 5)}
                            </div>

                            {/* Content */}
                            <p
                                style={{
                                    fontSize: '16px',
                                    lineHeight: '1.7',
                                    color: '#4b5563',
                                    marginBottom: '24px',
                                    fontStyle: 'italic'
                                }}
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    const newTestimonials = [...c.testimonials]
                                    newTestimonials[index] = { ...testimonial, content: e.target.innerText }
                                    onContentChange('testimonials', newTestimonials)
                                }}
                            >
                                "{testimonial.content}"
                            </p>

                            {/* Author */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {testimonial.image?.url ? (
                                    <img
                                        src={testimonial.image.url}
                                        alt={testimonial.name}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#dc2626',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            fontSize: '18px'
                                        }}
                                    >
                                        {testimonial.name?.charAt(0) || 'S'}
                                    </div>
                                )}
                                <div>
                                    <div
                                        style={{ fontWeight: '600', color: '#1f2937' }}
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newTestimonials = [...c.testimonials]
                                            newTestimonials[index] = { ...testimonial, name: e.target.innerText }
                                            onContentChange('testimonials', newTestimonials)
                                        }}
                                    >
                                        {testimonial.name}
                                    </div>
                                    <div
                                        style={{ fontSize: '14px', color: '#6b7280' }}
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newTestimonials = [...c.testimonials]
                                            newTestimonials[index] = { ...testimonial, role: e.target.innerText }
                                            onContentChange('testimonials', newTestimonials)
                                        }}
                                    >
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default TestimonialBlock
