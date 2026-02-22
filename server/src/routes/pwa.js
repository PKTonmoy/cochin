/**
 * PWA Routes
 * Dynamic manifest.json generated from admin GlobalSettings
 */

const express = require('express');
const router = express.Router();
const GlobalSettings = require('../models/GlobalSettings');

/**
 * GET /manifest.json
 * Dynamically generates the PWA manifest from admin settings.
 * Falls back to sensible defaults if settings are unavailable.
 */
router.get('/manifest.json', async (req, res) => {
    try {
        const settings = await GlobalSettings.getSettings();

        const siteName = settings.siteInfo?.name || 'PARAGON Coaching Center';
        // Use full site name as short name for PWA display
        const shortName = siteName;
        const description = settings.siteInfo?.tagline
            ? `${siteName} - ${settings.siteInfo.tagline}. Access your academic dashboard, check results, view schedules, and track your progress.`
            : `${siteName} Student Portal - Access your academic dashboard, check results, view schedules, and track your progress.`;
        const themeColor = settings.theme?.primaryColor || '#2563eb';

        const manifest = {
            name: `${siteName} Student Portal`,
            short_name: shortName,
            description,
            start_url: '/student-login',
            display: 'standalone',
            orientation: 'portrait',
            theme_color: themeColor,
            background_color: '#ffffff',
            categories: ['education'],
            lang: 'en',
            dir: 'ltr',
            scope: '/',
            icons: [
                { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: '/icons/maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ],
            screenshots: [
                {
                    src: '/icons/screenshot-wide.png',
                    sizes: '1280x720',
                    type: 'image/png',
                    form_factor: 'wide',
                    label: `${siteName} - Dashboard`
                },
                {
                    src: '/icons/screenshot-narrow.png',
                    sizes: '390x844',
                    type: 'image/png',
                    form_factor: 'narrow',
                    label: `${siteName} - Mobile Login`
                }
            ]
        };

        res.setHeader('Content-Type', 'application/manifest+json');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.json(manifest);
    } catch (error) {
        console.error('Error generating manifest:', error);
        // Return a static fallback so PWA still works even if DB is down
        res.setHeader('Content-Type', 'application/manifest+json');
        res.json({
            name: 'PARAGON Student Portal',
            short_name: 'PARAGON',
            description: 'PARAGON Coaching Center Student Portal',
            start_url: '/student-login',
            display: 'standalone',
            orientation: 'portrait',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            icons: [
                { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ]
        });
    }
});

module.exports = router;
