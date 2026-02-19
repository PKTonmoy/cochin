import { useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'

export default function DynamicMetadata() {
    const { settings } = useSettings()

    const siteName = settings?.siteInfo?.name || 'PARAGON'
    const tagline = settings?.siteInfo?.tagline

    // Get URL safely (handle object vs string)
    const getUrl = (obj) => {
        if (!obj) return null
        if (typeof obj === 'string') return obj
        return obj.url || null
    }

    const faviconUrl = getUrl(settings?.siteInfo?.favicon) ||
        getUrl(settings?.siteInfo?.logo) ||
        '/vite.svg'

    // Set default document title
    useEffect(() => {
        const defaultTitle = `${siteName} - ${tagline || 'Excellence in Education'}`
        document.title = defaultTitle
    }, [siteName, tagline])

    // Update favicon reactively (with rounded effect)
    useEffect(() => {
        const setFavicon = (url) => {
            let link = document.querySelector("link[rel~='icon']")
            if (!link) {
                link = document.createElement('link')
                link.rel = 'icon'
                document.head.appendChild(link)
            }
            link.href = url

            let appleLink = document.querySelector("link[rel='apple-touch-icon']")
            if (!appleLink) {
                appleLink = document.createElement('link')
                appleLink.rel = 'apple-touch-icon'
                document.head.appendChild(appleLink)
            }
            appleLink.href = url
        }

        if (!faviconUrl) return

        // Set the favicon URL immediately so it always appears,
        // even if the Canvas rounding below fails due to CORS
        setFavicon(faviconUrl)

        // Then attempt to create a rounded version as an enhancement
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const size = 64
                canvas.width = size
                canvas.height = size

                ctx.beginPath()
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()

                ctx.drawImage(img, 0, 0, size, size)

                // Upgrade to rounded favicon
                setFavicon(canvas.toDataURL())
            } catch (e) {
                // Canvas tainted by CORS — original URL is already set, nothing to do
                console.warn('Rounded favicon unavailable (CORS), using original URL')
            }
        }
        // onerror: original URL is already set, no action needed
        img.src = faviconUrl

    }, [faviconUrl])

    // React 19 native: meta tags rendered as JSX are automatically hoisted to <head>
    return (
        <>
            <meta name="application-name" content={siteName} />
            <meta name="apple-mobile-web-app-title" content={siteName} />
            {settings?.siteInfo?.description && (
                <meta name="description" content={settings.siteInfo.description} />
            )}
        </>
    )
}
