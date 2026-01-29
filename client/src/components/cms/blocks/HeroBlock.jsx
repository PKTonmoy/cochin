/**
 * Hero Block Component
 * Full-width hero section with background image and CTA
 */

import { useState } from 'react'
import { Edit2 } from 'lucide-react'

const HeroBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const [editingField, setEditingField] = useState(null)

    const defaultContent = {
        headline: { text: 'Welcome', fontSize: '48px', color: '#ffffff', fontWeight: '700' },
        subheadline: { text: 'Your journey starts here', fontSize: '20px', color: '#f3f4f6' },
        backgroundImage: { url: '', alt: '' },
        buttons: [{ text: 'Get Started', link: '#', style: 'primary' }],
        overlay: { enabled: true, color: 'rgba(0,0,0,0.4)' }
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundImage: c.backgroundImage?.url ? `url(${c.backgroundImage.url})` : 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: s.minHeight || '600px',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '120px 20px',
        textAlign: s.textAlign || 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }

    const overlayStyle = c.overlay?.enabled ? {
        position: 'absolute',
        inset: 0,
        backgroundColor: c.overlay.color || 'rgba(0,0,0,0.4)'
    } : {}

    const contentStyle = {
        position: 'relative',
        zIndex: 1,
        maxWidth: s.maxWidth || '800px',
        margin: '0 auto'
    }

    const handleTextEdit = (field, value) => {
        onContentChange(`${field}.text`, value)
    }

    return (
        <section className="block-hero" style={sectionStyle}>
            {c.overlay?.enabled && <div className="hero-overlay" style={overlayStyle} />}

            <div className="hero-content" style={contentStyle}>
                {/* Headline */}
                {isEditing ? (
                    <div className="editable-wrapper">
                        <h1
                            contentEditable
                            suppressContentEditableWarning
                            className="hero-headline editable"
                            style={{
                                fontSize: c.headline.fontSize,
                                color: c.headline.color,
                                fontWeight: c.headline.fontWeight
                            }}
                            onBlur={(e) => handleTextEdit('headline', e.target.innerText)}
                        >
                            {c.headline.text}
                        </h1>
                    </div>
                ) : (
                    <h1
                        className="hero-headline"
                        style={{
                            fontSize: c.headline.fontSize,
                            color: c.headline.color,
                            fontWeight: c.headline.fontWeight
                        }}
                    >
                        {c.headline.text}
                    </h1>
                )}

                {/* Subheadline */}
                {isEditing ? (
                    <div className="editable-wrapper">
                        <p
                            contentEditable
                            suppressContentEditableWarning
                            className="hero-subheadline editable"
                            style={{
                                fontSize: c.subheadline.fontSize,
                                color: c.subheadline.color
                            }}
                            onBlur={(e) => handleTextEdit('subheadline', e.target.innerText)}
                        >
                            {c.subheadline.text}
                        </p>
                    </div>
                ) : (
                    <p
                        className="hero-subheadline"
                        style={{
                            fontSize: c.subheadline.fontSize,
                            color: c.subheadline.color
                        }}
                    >
                        {c.subheadline.text}
                    </p>
                )}

                {/* Buttons */}
                {c.buttons?.length > 0 && (
                    <div className="hero-buttons">
                        {c.buttons.map((btn, index) => (
                            <a
                                key={index}
                                href={isEditing ? '#' : btn.link}
                                className={`hero-btn hero-btn-${btn.style || 'primary'}`}
                                onClick={(e) => isEditing && e.preventDefault()}
                            >
                                {btn.text}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default HeroBlock
