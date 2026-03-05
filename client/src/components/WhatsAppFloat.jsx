import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { MessageCircle } from 'lucide-react'

/**
 * WhatsAppFloat — Floating WhatsApp chat button
 * Premium glassmorphism design with pulse animation
 * Shows on all public pages, uses contact.whatsapp from settings
 */
export default function WhatsAppFloat() {
    const { settings } = useSettings()
    const [visible, setVisible] = useState(false)
    const [tooltip, setTooltip] = useState(false)

    // Get WhatsApp number from settings
    const whatsappNumber = settings?.contact?.whatsapp || ''

    // Don't render if no WhatsApp number is configured
    if (!whatsappNumber) return null

    // Skip on admin and student portal routes
    const path = window.location.pathname
    if (path.startsWith('/admin') || path.startsWith('/student') || path.startsWith('/qr/')) return null

    // Delay appearance for a smooth entrance
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 2000)
        return () => clearTimeout(timer)
    }, [])

    // Clean the number (remove spaces, dashes, etc.)
    const cleanNumber = whatsappNumber.replace(/[\s\-()]/g, '')
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent('হ্যালো! আমি আপনাদের কোচিং সেন্টার সম্পর্কে জানতে চাই।')}`

    return (
        <>
            <style>{`
                @keyframes wa-float-entrance {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    60% { transform: scale(1.15) rotate(10deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes wa-pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes wa-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .wa-float-btn {
                    position: fixed;
                    bottom: 28px;
                    right: 28px;
                    z-index: 90;
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    box-shadow: 0 6px 24px rgba(37, 211, 102, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: wa-float-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    text-decoration: none;
                }
                .wa-float-btn:hover {
                    transform: scale(1.08);
                    box-shadow: 0 8px 32px rgba(37, 211, 102, 0.45), 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .wa-float-btn:active {
                    transform: scale(0.95);
                }
                .wa-pulse-ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    background: rgba(37, 211, 102, 0.3);
                    animation: wa-pulse-ring 2s ease-out infinite;
                    pointer-events: none;
                }
                .wa-tooltip {
                    position: absolute;
                    right: 68px;
                    bottom: 50%;
                    transform: translateY(50%);
                    background: white;
                    color: #1e293b;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'Hind Siliguri', 'Inter', sans-serif;
                    white-space: nowrap;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.25s ease, transform 0.25s ease;
                    transform: translateY(50%) translateX(8px);
                }
                .wa-tooltip.show {
                    opacity: 1;
                    transform: translateY(50%) translateX(0);
                }
                .wa-tooltip::before {
                    content: '';
                    position: absolute;
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 6px solid transparent;
                    border-left-color: white;
                }
                .wa-icon {
                    animation: wa-bounce 3s ease-in-out infinite;
                    animation-delay: 3s;
                }
                @media (max-width: 640px) {
                    .wa-float-btn {
                        bottom: 100px;
                        right: 16px;
                        width: 50px;
                        height: 50px;
                        border-radius: 14px;
                    }
                    .wa-tooltip {
                        display: none;
                    }
                }
            `}</style>

            {visible && (
                <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-float-btn"
                    onMouseEnter={() => setTooltip(true)}
                    onMouseLeave={() => setTooltip(false)}
                    aria-label="Chat on WhatsApp"
                >
                    <div className="wa-pulse-ring" />
                    <div className="wa-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className={`wa-tooltip ${tooltip ? 'show' : ''}`}>
                        💬 আমাদের সাথে চ্যাট করুন
                    </div>
                </a>
            )}
        </>
    )
}
