/**
 * Gallery Block Component
 * Image gallery with masonry, grid, or carousel layouts
 */

import { Image as ImageIcon } from 'lucide-react'

const GalleryBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'Gallery', fontSize: '32px', color: '#1f2937' },
        images: [],
        layout: 'grid', // grid, masonry, carousel
        columns: 4
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || 'transparent',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '60px 20px'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '1200px',
        margin: '0 auto'
    }

    if (c.images?.length === 0) {
        return (
            <section className="block-gallery" style={sectionStyle}>
                <div style={containerStyle}>
                    {c.title?.text && (
                        <h2 style={{ fontSize: c.title.fontSize, color: c.title.color, textAlign: 'center', marginBottom: '40px' }}>
                            {c.title.text}
                        </h2>
                    )}
                    <div className="gallery-empty" style={{ textAlign: 'center', padding: '60px', background: '#f9fafb', borderRadius: '12px' }}>
                        <ImageIcon size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                        <p style={{ color: '#6b7280' }}>No images in gallery</p>
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>Add images using the properties panel</span>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="block-gallery" style={sectionStyle}>
            <div style={containerStyle}>
                {c.title?.text && (
                    <h2
                        style={{ fontSize: c.title.fontSize, color: c.title.color, textAlign: 'center', marginBottom: '40px' }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('title.text', e.target.innerText)}
                    >
                        {c.title.text}
                    </h2>
                )}

                <div
                    className="gallery-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${c.columns || 4}, 1fr)`,
                        gap: '12px'
                    }}
                >
                    {c.images.map((image, index) => (
                        <div
                            key={index}
                            className="gallery-item"
                            style={{
                                position: 'relative',
                                paddingBottom: '100%',
                                overflow: 'hidden',
                                borderRadius: '8px'
                            }}
                        >
                            <img
                                src={image.url}
                                alt={image.alt || ''}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s ease'
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default GalleryBlock
