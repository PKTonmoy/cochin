import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const SettingsContext = createContext(null)

// Default fallback settings
const defaultSettings = {
    siteInfo: {
        name: 'PARAGON',
        tagline: 'Transform Your Future',
        logo: { url: '' },
        favicon: { url: '' }
    },
    contact: {
        phones: ['09666775566'],
        email: 'info@paragon.edu.bd',
        whatsapp: '',
        address: {
            street: '',
            city: 'ঢাকা',
            state: '',
            country: 'Bangladesh',
            postalCode: '',
            googleMapsLink: ''
        },
        officeHours: {
            weekdays: '9:00 AM - 7:00 PM',
            saturday: '9:00 AM - 5:00 PM',
            sunday: 'Closed'
        }
    },
    theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        accentColor: '#F97316'
    },
    socialMedia: {
        facebook: '',
        instagram: '',
        youtube: '',
        linkedin: '',
        twitter: '',
        tiktok: ''
    }
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        // Return defaults if used outside provider (for safety)
        return { settings: defaultSettings, isLoading: false }
    }
    return context
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/public')
                if (response.data?.data) {
                    // Merge with defaults to ensure all fields exist
                    setSettings(prev => ({
                        siteInfo: { ...prev.siteInfo, ...response.data.data.siteInfo },
                        contact: {
                            ...prev.contact,
                            ...response.data.data.contact,
                            address: { ...prev.contact.address, ...response.data.data.contact?.address },
                            officeHours: { ...prev.contact.officeHours, ...response.data.data.contact?.officeHours }
                        },
                        theme: { ...prev.theme, ...response.data.data.theme },
                        socialMedia: { ...prev.socialMedia, ...response.data.data.socialMedia }
                    }))
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error)
                // Keep defaults on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    // Helper functions for common data access
    const getSiteName = () => settings.siteInfo?.name || defaultSettings.siteInfo.name
    const getTagline = () => settings.siteInfo?.tagline || defaultSettings.siteInfo.tagline
    const getLogo = () => settings.siteInfo?.logo?.url || ''
    const getPrimaryPhone = () => settings.contact?.phones?.[0] || defaultSettings.contact.phones[0]
    const getEmail = () => settings.contact?.email || defaultSettings.contact.email
    const getAddress = () => {
        const addr = settings.contact?.address || defaultSettings.contact.address
        return addr.city || 'ঢাকা, বাংলাদেশ'
    }
    const getSocialLinks = () => settings.socialMedia || defaultSettings.socialMedia

    const value = {
        settings,
        isLoading,
        getSiteName,
        getTagline,
        getLogo,
        getPrimaryPhone,
        getEmail,
        getAddress,
        getSocialLinks
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export default SettingsContext
