import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
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
    },
    receiptTemplate: {
        primaryColor: '#1a365d',
        showLogo: true,
        showQRCode: true,
        showCredentialsOnFirst: true,
        footerNote: 'This is a computer-generated receipt. Please keep this for your records.',
        signatureLeftLabel: 'Student/Guardian',
        signatureRightLabel: 'Authorized Signature'
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
    const { data: fetchedSettings, isLoading } = useQuery({
        queryKey: ['public-settings'],
        queryFn: async () => {
            try {
                const response = await api.get('/settings/public')
                return response.data?.data
            } catch (error) {
                console.error('Failed to fetch settings:', error)
                return null
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1
    })

    // Merge fetched settings with defaults
    const settings = {
        ...defaultSettings,
        ...(fetchedSettings || {}),
        siteInfo: { ...defaultSettings.siteInfo, ...(fetchedSettings?.siteInfo || {}) },
        contact: {
            ...defaultSettings.contact,
            ...(fetchedSettings?.contact || {}),
            address: { ...defaultSettings.contact.address, ...(fetchedSettings?.contact?.address || {}) },
            officeHours: { ...defaultSettings.contact.officeHours, ...(fetchedSettings?.contact?.officeHours || {}) }
        },
        theme: { ...defaultSettings.theme, ...(fetchedSettings?.theme || {}) },
        socialMedia: { ...defaultSettings.socialMedia, ...(fetchedSettings?.socialMedia || {}) },
        receiptTemplate: { ...defaultSettings.receiptTemplate, ...(fetchedSettings?.receiptTemplate || {}) }
    }

    // Helper functions for common data access
    const getSiteName = () => settings.siteInfo?.name || defaultSettings.siteInfo.name
    const getTagline = () => settings.siteInfo?.tagline || defaultSettings.siteInfo.tagline
    const getLogo = () => settings.siteInfo?.logo?.url || settings.siteInfo?.logo || ''
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
