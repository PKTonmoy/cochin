/**
 * Builder.io Page Component
 * Renders pages created in Builder.io visual editor
 */

import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { BuilderComponent, useIsPreviewing } from '@builder.io/react'
import { builder } from '../../lib/builder'

const BuilderPage = () => {
    const { '*': path } = useParams()
    const location = useLocation()
    const [content, setContent] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const isPreviewing = useIsPreviewing()

    // Construct the URL path for Builder
    const urlPath = path ? `/${path}` : location.pathname

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true)
            setNotFound(false)

            try {
                // Fetch the page content from Builder.io
                const pageContent = await builder
                    .get('page', {
                        url: urlPath,
                        options: {
                            includeRefs: true,
                        },
                    })
                    .promise()

                if (pageContent) {
                    setContent(pageContent)
                } else if (!isPreviewing) {
                    setNotFound(true)
                }
            } catch (error) {
                console.error('Error fetching Builder content:', error)
                setNotFound(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchContent()
    }, [urlPath, isPreviewing])

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading page...</p>
                </div>
            </div>
        )
    }

    // 404 state (but still render BuilderComponent for previewing)
    if (notFound && !isPreviewing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-500 mb-6">Page not found</p>
                    <a
                        href="/"
                        className="btn btn-primary"
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* SEO - Builder.io pages can have their own meta tags */}
            {content?.data && (
                <>
                    {content.data.title && <title>{content.data.title} | PARAGON</title>}
                    {content.data.description && (
                        <meta name="description" content={content.data.description} />
                    )}
                </>
            )}

            {/* Builder.io Content */}
            <BuilderComponent
                model="page"
                content={content}
                options={{
                    includeRefs: true,
                }}
            />
        </>
    )
}

export default BuilderPage
