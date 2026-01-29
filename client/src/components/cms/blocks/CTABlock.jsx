/**
 * CTA Block Component
 * Call-to-action banner with gradient background
 */

const CTABlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        headline: { text: 'Ready to Get Started?', fontSize: '36px', color: '#ffffff', fontWeight: '700' },
        subheadline: { text: 'Join thousands of successful students', fontSize: '18px', color: '#fecaca' },
        buttons: [
            { text: 'Enroll Now', link: '/contact', style: 'primary' },
            { text: 'Learn More', link: '/about', style: 'secondary' }
        ],
        backgroundGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        background: c.backgroundGradient || s.backgroundColor || 'linear-gradient(135deg, #dc2626, #991b1b)',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '80px 20px',
        textAlign: s.textAlign || 'center'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '800px',
        margin: '0 auto'
    }

    return (
        <section className="block-cta" style={sectionStyle}>
            <div style={containerStyle}>
                {/* Headline */}
                <h2
                    style={{
                        fontSize: c.headline.fontSize,
                        color: c.headline.color,
                        fontWeight: c.headline.fontWeight,
                        marginBottom: '16px'
                    }}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('headline.text', e.target.innerText)}
                >
                    {c.headline.text}
                </h2>

                {/* Subheadline */}
                <p
                    style={{
                        fontSize: c.subheadline.fontSize,
                        color: c.subheadline.color,
                        marginBottom: '32px'
                    }}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('subheadline.text', e.target.innerText)}
                >
                    {c.subheadline.text}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {c.buttons?.map((btn, index) => (
                        <a
                            key={index}
                            href={isEditing ? '#' : btn.link}
                            onClick={(e) => isEditing && e.preventDefault()}
                            style={{
                                padding: '14px 32px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '16px',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                ...(btn.style === 'primary' ? {
                                    backgroundColor: '#ffffff',
                                    color: '#dc2626'
                                } : {
                                    backgroundColor: 'transparent',
                                    color: '#ffffff',
                                    border: '2px solid rgba(255,255,255,0.5)'
                                })
                            }}
                        >
                            {btn.text}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default CTABlock
