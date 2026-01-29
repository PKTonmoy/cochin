/**
 * Form Block Component
 * Contact/inquiry form section
 */

import { Send } from 'lucide-react'

const FormBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'Contact Us', fontSize: '32px', color: '#1f2937' },
        subtitle: { text: 'Get in touch with us today', fontSize: '16px', color: '#6b7280' },
        fields: [
            { type: 'text', name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
            { type: 'email', name: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
            { type: 'tel', name: 'phone', label: 'Phone Number', placeholder: 'Enter your phone', required: false },
            { type: 'textarea', name: 'message', label: 'Message', placeholder: 'How can we help you?', required: true }
        ],
        submitText: 'Send Message',
        successMessage: 'Thank you! We will get back to you soon.'
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || '#f9fafb',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '60px 20px'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '600px',
        margin: '0 auto'
    }

    const inputStyle = {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    }

    return (
        <section className="block-form" style={sectionStyle}>
            <div style={containerStyle}>
                {/* Title */}
                {c.title?.text && (
                    <h2
                        style={{
                            fontSize: c.title.fontSize,
                            color: c.title.color,
                            textAlign: 'center',
                            marginBottom: '12px'
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('title.text', e.target.innerText)}
                    >
                        {c.title.text}
                    </h2>
                )}

                {/* Subtitle */}
                {c.subtitle?.text && (
                    <p
                        style={{
                            fontSize: c.subtitle.fontSize,
                            color: c.subtitle.color,
                            textAlign: 'center',
                            marginBottom: '40px'
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('subtitle.text', e.target.innerText)}
                    >
                        {c.subtitle.text}
                    </p>
                )}

                {/* Form */}
                <form
                    style={{
                        backgroundColor: '#ffffff',
                        padding: '32px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    onSubmit={(e) => e.preventDefault()}
                >
                    {c.fields?.map((field, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '20px'
                            }}
                        >
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '6px'
                                }}
                            >
                                {field.label}
                                {field.required && <span style={{ color: '#dc2626' }}> *</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    rows={4}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    disabled={isEditing}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    required={field.required}
                                    style={inputStyle}
                                    disabled={isEditing}
                                >
                                    <option value="">{field.placeholder || 'Select...'}</option>
                                    {field.options?.map((opt, i) => (
                                        <option key={i} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    style={inputStyle}
                                    disabled={isEditing}
                                />
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: isEditing ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                        }}
                        disabled={isEditing}
                    >
                        <Send size={18} />
                        <span
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => onContentChange('submitText', e.target.innerText)}
                        >
                            {c.submitText}
                        </span>
                    </button>
                </form>
            </div>
        </section>
    )
}

export default FormBlock
