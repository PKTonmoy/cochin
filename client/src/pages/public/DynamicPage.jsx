/**
 * Dynamic Page Component
 * Renders published CMS pages and previews
 */

import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import api from '../../lib/api'

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

const DynamicPage = ({ defaultSlug }) => {
    const { slug: urlSlug } = useParams()
    const slug = urlSlug || defaultSlug
    const location = useLocation()
    const [page, setPage] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check if this is a preview page
    const isPreview = location.pathname.startsWith('/preview/')
    const previewToken = isPreview ? slug : null

    useEffect(() => {
        const fetchPage = async () => {
            setIsLoading(true)
            setError(null)

            try {
                let response
                if (isPreview && previewToken) {
                    // Fetch preview page
                    response = await api.get(`/cms/preview/${previewToken}`)
                } else {
                    // Fetch published page
                    response = await api.get(`/cms/public/pages/${slug}`)
                }

                if (response.data.success) {
                    setPage(response.data.data)
                } else {
                    setError('Page not found')
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setError('Page not found')
                } else {
                    setError('Failed to load page')
                }
            } finally {
                setIsLoading(false)
            }
        }

        if (slug) {
            fetchPage()
        }
    }, [slug, isPreview, previewToken])

    // Loading state
    if (isLoading) {
        return (
            <div className="dynamic-page-loading">
                <div className="loading-spinner">
                    <div className="spinner" />
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="dynamic-page-error">
                <h1>404</h1>
                <p>{error}</p>
                <a href="/">Go to Homepage</a>
            </div>
        )
    }

    // No page found
    if (!page) {
        return (
            <div className="dynamic-page-error">
                <h1>Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/">Go to Homepage</a>
            </div>
        )
    }

    const sections = page.sections || page.publishedSections || []

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{page.seo?.title || page.pageName} | PARAGON</title>
                {page.seo?.description && (
                    <meta name="description" content={page.seo.description} />
                )}
                {page.seo?.keywords?.length > 0 && (
                    <meta name="keywords" content={page.seo.keywords.join(', ')} />
                )}
                {page.seo?.ogImage && (
                    <meta property="og:image" content={page.seo.ogImage} />
                )}
                {page.seo?.noIndex && (
                    <meta name="robots" content="noindex, nofollow" />
                )}
            </Helmet>

            {/* Preview Banner */}
            {page.isPreview && (
                <div className="preview-banner">
                    <span>Preview Mode</span>
                    <p>This is a preview. Changes may not be published yet.</p>
                </div>
            )}

            {/* Page Content */}
            <main className="dynamic-page">
                {sections.map((section) => {
                    // Skip hidden sections
                    if (!section.visible) return null

                    const BlockComponent = blockComponents[section.type]

                    if (!BlockComponent) {
                        console.warn(`Unknown block type: ${section.type}`)
                        return null
                    }

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

                {sections.length === 0 && (
                    <div className="empty-page">
                        <p>This page has no content yet.</p>
                    </div>
                )}
            </main>
        </>
    )
}

export default DynamicPage
