/**
 * Image Block Component
 * Single or multiple images with various layouts
 */

import { Image as ImageIcon } from 'lucide-react'

const ImageBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        images: [],
        layout: 'single', // single, grid, carousel
        columns: 3,
        aspectRatio: '16:9',
        lightbox: true,
        caption: ''
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || 'transparent',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '40px 20px'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '1200px',
        margin: '0 auto'
    }

    // Render empty state for editing
    if (c.images?.length === 0) {
        return (
            <section className="block-image" style={sectionStyle}>
                <div className="image-container" style={containerStyle}>
                    <div className="image-empty">
                        <ImageIcon size={48} />
                        <p>No images added</p>
                        <span>Add images using the properties panel</span>
                    </div>
                </div>
            </section>
        )
    }

    // Single image layout
    if (c.layout === 'single' && c.images?.[0]) {
        const image = c.images[0]
        return (
            <section className="block-image" style={sectionStyle}>
                <div className="image-container" style={containerStyle}>
                    <figure className="image-single">
                        <img
                            src={image.url}
                            alt={image.alt || ''}
                            style={{
                                width: '100%',
                                borderRadius: s.borderRadius || '8px',
                                boxShadow: s.boxShadow || 'none'
                            }}
                        />
                        {image.caption && (
                            <figcaption className="image-caption">{image.caption}</figcaption>
                        )}
                    </figure>
                </div>
            </section>
        )
    }

    // Grid layout
    if (c.layout === 'grid') {
        return (
            <section className="block-image" style={sectionStyle}>
                <div className="image-container" style={containerStyle}>
                    <div
                        className="image-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${c.columns || 3}, 1fr)`,
                            gap: '16px'
                        }}
                    >
                        {c.images.map((image, index) => (
                            <figure key={index} className="image-grid-item">
                                <img
                                    src={image.url}
                                    alt={image.alt || ''}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                            </figure>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    // Default - show first image
    return (
        <section className="block-image" style={sectionStyle}>
            <div className="image-container" style={containerStyle}>
                {c.images?.[0]?.url ? (
                    <img
                        src={c.images[0].url}
                        alt={c.images[0].alt || ''}
                        style={{ width: '100%', borderRadius: '8px' }}
                    />
                ) : (
                    <div className="image-empty">
                        <ImageIcon size={48} />
                        <p>Add an image</p>
                    </div>
                )}
            </div>
        </section>
    )
}

export default ImageBlock
