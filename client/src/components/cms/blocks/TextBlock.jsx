/**
 * Text Block Component
 * Rich text content section with title
 */

const TextBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'Section Title', fontSize: '32px', color: '#1f2937', fontWeight: '600' },
        body: '<p>Enter your content here.</p>',
        alignment: 'left'
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || 'transparent',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '60px 20px',
        textAlign: c.alignment || 'left'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '800px',
        margin: '0 auto'
    }

    return (
        <section className="block-text" style={sectionStyle}>
            <div className="text-container" style={containerStyle}>
                {/* Title */}
                {c.title?.text && (
                    isEditing ? (
                        <h2
                            contentEditable
                            suppressContentEditableWarning
                            className="text-title editable"
                            style={{
                                fontSize: c.title.fontSize,
                                color: c.title.color,
                                fontWeight: c.title.fontWeight,
                                marginBottom: '24px'
                            }}
                            onBlur={(e) => onContentChange('title.text', e.target.innerText)}
                        >
                            {c.title.text}
                        </h2>
                    ) : (
                        <h2
                            className="text-title"
                            style={{
                                fontSize: c.title.fontSize,
                                color: c.title.color,
                                fontWeight: c.title.fontWeight,
                                marginBottom: '24px'
                            }}
                        >
                            {c.title.text}
                        </h2>
                    )
                )}

                {/* Body Content */}
                {isEditing ? (
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-body editable"
                        style={{
                            fontSize: '16px',
                            lineHeight: '1.8',
                            color: '#4b5563'
                        }}
                        onBlur={(e) => onContentChange('body', e.target.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: c.body }}
                    />
                ) : (
                    <div
                        className="text-body"
                        style={{
                            fontSize: '16px',
                            lineHeight: '1.8',
                            color: '#4b5563'
                        }}
                        dangerouslySetInnerHTML={{ __html: c.body }}
                    />
                )}
            </div>
        </section>
    )
}

export default TextBlock
