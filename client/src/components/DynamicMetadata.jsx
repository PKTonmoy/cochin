import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
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

        // Try to create a rounded favicon using Canvas
        const img = new Image()
        img.crossOrigin = 'anonymous' // Attempt to load cross-origin images
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const size = 64 // Standard favicon size
                canvas.width = size
                canvas.height = size

                // Draw rounded circle
                ctx.beginPath()
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()

                // Draw image
                ctx.drawImage(img, 0, 0, size, size)

                // Set rounded favicon
                setFavicon(canvas.toDataURL())
            } catch (e) {
                // If canvas gets tainted or error, fallback to original URL
                console.warn('Failed to generate rounded favicon, using original:', e)
                setFavicon(faviconUrl)
            }
        }
        img.onerror = () => {
            // If image fails to load, fallback to original URL (might be .ico or other format)
            setFavicon(faviconUrl)
        }
        img.src = faviconUrl

    }, [faviconUrl])

    return (
        <Helmet
            defaultTitle={`${siteName} - ${tagline || 'Excellence in Education'}`}
            titleTemplate={`%s | ${siteName}`}
        >
            <meta name="application-name" content={siteName} />
            <meta name="apple-mobile-web-app-title" content={siteName} />
            {settings?.siteInfo?.description && (
                <meta name="description" content={settings.siteInfo.description} />
            )}
        </Helmet>
    )
}
