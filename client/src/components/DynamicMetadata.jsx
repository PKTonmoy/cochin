import { Helmet } from 'react-helmet-async'
import { useSettings } from '../contexts/SettingsContext'

export default function DynamicMetadata() {
    const { settings, isLoading } = useSettings()

    // Default values
    const defaultTitle = 'PARAGON Coaching Center - Excellence in Education'
    const defaultFavicon = '/vite.svg'

    // If settings are not available (should rarely happen due to context defaults), show default
    if (!settings) {
        return (
            <Helmet>
                <title>{defaultTitle}</title>
                <link rel="icon" type="image/svg+xml" href={defaultFavicon} />
            </Helmet>
        )
    }

    const siteName = settings.siteInfo?.name || 'PARAGON'
    const tagline = settings.siteInfo?.tagline

    // Construct title
    const title = tagline ? `${siteName} - ${tagline}` : siteName

    // Get favicon URL (safely handle object vs string)
    const getUrl = (obj) => {
        if (!obj) return null
        if (typeof obj === 'string') return obj
        return obj.url || null
    }

    const faviconUrl = getUrl(settings.siteInfo?.favicon) ||
        getUrl(settings.siteInfo?.logo) ||
        defaultFavicon

    return (
        <Helmet>
            <title>{title}</title>
            <link rel="icon" href={faviconUrl} />
            {/* Also update apple-touch-icon if needed, but standard icon is usually sufficient for browser tab */}
            <link rel="apple-touch-icon" href={faviconUrl} />

            {/* Basic Meta Tags */}
            <meta name="application-name" content={siteName} />
            <meta name="apple-mobile-web-app-title" content={siteName} />

            {/* Description fallback if not handled by individual pages */}
            {settings.siteInfo?.description && (
                <meta name="description" content={settings.siteInfo.description} />
            )}
        </Helmet>
    )
}
