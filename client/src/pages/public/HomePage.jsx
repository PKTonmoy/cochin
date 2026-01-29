/**
 * HomePage Component
 * Loads landing page from CMS if available, otherwise falls back to static LandingPage
 */

import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import api from '../../lib/api'
import LandingPage from './LandingPage'

// Import block components for rendering
import HeroBlock from '../../components/cms/blocks/HeroBlock'
import TextBlock from '../../components/cms/blocks/TextBlock'
import ImageBlock from '../../components/cms/blocks/ImageBlock'
import CardGridBlock from '../../components/cms/blocks/CardGridBlock'
import GalleryBlock from '../../components/cms/blocks/GalleryBlock'
import TestimonialBlock from '../../components/cms/blocks/TestimonialBlock'
import CTABlock from '../../components/cms/blocks/CTABlock'
import StatisticsBlock from '../../components/cms/blocks/StatisticsBlock'
import FormBlock from '../../components/cms/blocks/FormBlock'

// Block component mapping
const blockComponents = {
    hero: HeroBlock,
    text: TextBlock,
    image: ImageBlock,
    cardGrid: CardGridBlock,
    gallery: GalleryBlock,
    testimonial: TestimonialBlock,
    cta: CTABlock,
    statistics: StatisticsBlock,
    form: FormBlock
}

const HomePage = () => {
    const [cmsPage, setCmsPage] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [useFallback, setUseFallback] = useState(false)

    useEffect(() => {
        const fetchHomePage = async () => {
            try {
                // Try to fetch "home" page from CMS
                const response = await api.get('/cms/public/pages/home')
                if (response.data.success && response.data.data) {
                    setCmsPage(response.data.data)
                } else {
                    setUseFallback(true)
                }
            } catch (error) {
                // No CMS home page exists, use fallback
                setUseFallback(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchHomePage()
    }, [])

    // Show loading state briefly
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    // Fall back to static landing page if no CMS page
    if (useFallback || !cmsPage) {
        return <LandingPage />
    }

    // Render CMS page
    const sections = cmsPage.sections || cmsPage.publishedSections || []

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{cmsPage.seo?.title || cmsPage.pageName || 'PARAGON Coaching Center'}</title>
                {cmsPage.seo?.description && (
                    <meta name="description" content={cmsPage.seo.description} />
                )}
                {cmsPage.seo?.keywords?.length > 0 && (
                    <meta name="keywords" content={cmsPage.seo.keywords.join(', ')} />
                )}
            </Helmet>

            {/* Page Content */}
            <main className="cms-home-page">
                {sections.map((section) => {
                    if (!section.visible) return null

                    const BlockComponent = blockComponents[section.type]
                    if (!BlockComponent) return null

                    return (
                        <BlockComponent
                            key={section.id}
                            section={section}
                            content={section.content}
                            styles={section.styles}
                            isEditing={false}
                            onContentChange={() => { }}
                            onStyleChange={() => { }}
                        />
                    )
                })}
            </main>
        </>
    )
}

export default HomePage
