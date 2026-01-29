/**
 * Card Grid Block Component
 * Feature cards in a grid layout
 */

import { Star, Award, Target, Check, Zap, Heart, Shield, Users, Lightbulb, Rocket } from 'lucide-react'

const iconMap = {
    star: Star,
    award: Award,
    target: Target,
    check: Check,
    zap: Zap,
    heart: Heart,
    shield: Shield,
    users: Users,
    lightbulb: Lightbulb,
    rocket: Rocket
}

const CardGridBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'Our Features', fontSize: '32px', color: '#1f2937' },
        cards: [
            { title: 'Feature 1', description: 'Description for feature 1', icon: 'star', image: { url: '' } },
            { title: 'Feature 2', description: 'Description for feature 2', icon: 'award', image: { url: '' } },
            { title: 'Feature 3', description: 'Description for feature 3', icon: 'target', image: { url: '' } }
        ],
        columns: 3,
        cardStyle: 'elevated' // elevated, bordered, flat
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

    const getCardStyles = () => {
        switch (c.cardStyle) {
            case 'bordered':
                return { border: '1px solid #e5e7eb', boxShadow: 'none' }
            case 'flat':
                return { boxShadow: 'none', backgroundColor: 'transparent' }
            default: // elevated
                return { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none' }
        }
    }

    return (
        <section className="block-card-grid" style={sectionStyle}>
            <div className="card-grid-container" style={containerStyle}>
                {/* Title */}
                {c.title?.text && (
                    <h2
                        className="card-grid-title"
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

                {/* Cards Grid */}
                <div
                    className="cards-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${c.columns || 3}, 1fr)`,
                        gap: '24px'
                    }}
                >
                    {c.cards?.map((card, index) => {
                        const IconComponent = iconMap[card.icon] || Star

                        return (
                            <div
                                key={index}
                                className="feature-card"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    ...getCardStyles()
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className="card-icon"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '12px',
                                        backgroundColor: '#fef2f2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px'
                                    }}
                                >
                                    <IconComponent size={28} color="#dc2626" />
                                </div>

                                {/* Card Title */}
                                <h3
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        marginBottom: '12px'
                                    }}
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const newCards = [...c.cards]
                                        newCards[index] = { ...card, title: e.target.innerText }
                                        onContentChange('cards', newCards)
                                    }}
                                >
                                    {card.title}
                                </h3>

                                {/* Description */}
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        lineHeight: '1.6'
                                    }}
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const newCards = [...c.cards]
                                        newCards[index] = { ...card, description: e.target.innerText }
                                        onContentChange('cards', newCards)
                                    }}
                                >
                                    {card.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default CardGridBlock
