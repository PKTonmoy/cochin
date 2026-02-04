/**
 * Builder.io Configuration
 * Initialize Builder.io with your API key
 */

import { builder, Builder } from '@builder.io/react'

// Initialize Builder.io with API key from environment variable
// Add VITE_BUILDER_API_KEY to your .env file
const BUILDER_API_KEY = import.meta.env.VITE_BUILDER_API_KEY || ''

if (BUILDER_API_KEY) {
    try {
        builder.init(BUILDER_API_KEY)
        
        // Optional: Set targeting attributes for personalization
        builder.setUserAttributes({
            // You can add user targeting attributes here
            // isLoggedIn: true,
            // userType: 'student',
        })
    } catch (error) {
        console.error('Failed to initialize Builder.io:', error)
    }
} else {
    console.warn('Builder.io API key not configured. Set VITE_BUILDER_API_KEY in .env')
}

// Register custom components that can be used in Builder
// This allows you to use your existing React components in the Builder editor

// Example: Register a custom Hero component
// Builder.registerComponent(HeroSection, {
//   name: 'Hero Section',
//   inputs: [
//     { name: 'title', type: 'string', defaultValue: 'Welcome' },
//     { name: 'subtitle', type: 'string', defaultValue: 'Your subtitle here' },
//   ],
// })

export { builder, Builder }
