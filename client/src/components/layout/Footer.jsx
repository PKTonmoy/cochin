import { Link } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import {
    GraduationCap, Phone, Mail, MapPin,
    Facebook, Instagram, Youtube, Twitter
} from 'lucide-react'

const Footer = () => {
    const { getSiteName, getTagline, getPrimaryPhone, getEmail, getAddress, getSocialLinks } = useSettings()

    const socialLinks = getSocialLinks()

    // Social media icons with their URLs
    const socialIcons = [
        { Icon: Facebook, url: socialLinks.facebook, label: 'Facebook' },
        { Icon: Instagram, url: socialLinks.instagram, label: 'Instagram' },
        { Icon: Youtube, url: socialLinks.youtube, label: 'Youtube' },
        { Icon: Twitter, url: socialLinks.twitter, label: 'Twitter' }
    ]

    return (
        <footer className="footer-cyber">
            <div className="container-cyber">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-2xl font-bold mb-4">
                            <GraduationCap size={32} className="text-blue-500" />
                            <span className="gradient-text">{getSiteName()}</span>
                        </Link>
                        <p className="text-gray-500 text-sm font-bangla">{getTagline()}</p>
                        <div className="flex gap-3 mt-4">
                            {socialIcons.map(({ Icon, url, label }, i) => (
                                <a
                                    key={i}
                                    href={url || '#'}
                                    target={url ? '_blank' : undefined}
                                    rel={url ? 'noopener noreferrer' : undefined}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-white hover:bg-blue-500 transition-all"
                                    aria-label={label}
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900">Quick Links</h4>
                        <ul className="space-y-2 text-gray-500 text-sm">
                            <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
                            <li><Link to="/programs" className="hover:text-blue-500 transition-colors">Programs</Link></li>
                            <li><Link to="/stories" className="hover:text-blue-500 transition-colors">Success Stories</Link></li>
                            <li><a href="/#contact" className="hover:text-blue-500 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Programs */}
                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900">Programs</h4>
                        <ul className="space-y-2 text-gray-500 text-sm font-bangla">
                            <li>মেডিকেল এডমিশন</li>
                            <li>ইঞ্জিনিয়ারিং এডমিশন</li>
                            <li>HSC Academic</li>
                            <li>বিশ্ববিদ্যালয় ভর্তি</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900">Contact</h4>
                        <ul className="space-y-2 text-gray-500 text-sm">
                            <li className="flex items-center gap-2">
                                <Phone size={14} />
                                <a href={`tel:${getPrimaryPhone()}`} className="hover:text-blue-500 transition-colors">
                                    {getPrimaryPhone()}
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail size={14} />
                                <a href={`mailto:${getEmail()}`} className="hover:text-blue-500 transition-colors">
                                    {getEmail()}
                                </a>
                            </li>
                            <li className="flex items-center gap-2 font-bangla">
                                <MapPin size={14} />
                                {getAddress()}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6 text-center text-gray-400 text-sm">
                    <p className="mb-2">© {new Date().getFullYear()} {getSiteName()}. All rights reserved.</p>
                    <p className="flex items-center justify-center gap-1 text-xs font-medium">
                        Powered by
                        <a
                            href="https://www.facebook.com/tonmoy.pramanik.50"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
                        >
                            Tonmoy Pramanik
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
