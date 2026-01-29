import { useCallback, useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const ParticleNetwork = ({ particleCount = 60 }) => {
    const [init, setInit] = useState(false)

    useEffect(() => {
        // Don't initialize if no particles requested
        if (particleCount <= 0) return

        initParticlesEngine(async (engine) => {
            await loadSlim(engine)
        }).then(() => {
            setInit(true)
        }).catch((err) => {
            console.warn('Failed to initialize particles:', err)
        })
    }, [particleCount])

    const particlesLoaded = useCallback(async (container) => {
        // Particles loaded
    }, [])

    // Dynamic particle options based on count
    const options = {
        background: {
            color: {
                value: 'transparent'
            }
        },
        fpsLimit: particleCount > 40 ? 60 : 30, // Lower FPS for fewer particles
        interactivity: {
            events: {
                onClick: {
                    enable: particleCount > 30,
                    mode: 'push'
                },
                onHover: {
                    enable: true,
                    mode: 'grab'
                },
                resize: true
            },
            modes: {
                push: {
                    quantity: 1
                },
                grab: {
                    distance: 120,
                    links: {
                        opacity: 0.3,
                        color: '#5DADE2'
                    }
                }
            }
        },
        particles: {
            color: {
                // Website theme colors: Sky Blue & Orange
                value: ['#2E86AB', '#F5A623', '#3498db']
            },
            links: {
                color: {
                    value: '#2E86AB'
                },
                distance: particleCount > 40 ? 130 : 100,
                enable: true,
                opacity: 0.2,
                width: 1
            },
            move: {
                direction: 'none',
                enable: true,
                outModes: {
                    default: 'bounce'
                },
                random: true,
                speed: particleCount > 40 ? 0.6 : 0.4,
                straight: false
            },
            number: {
                density: {
                    enable: true,
                    width: 1920,
                    height: 1080
                },
                value: particleCount
            },
            opacity: {
                value: { min: 0.3, max: 0.6 }
            },
            shape: {
                type: 'circle'
            },
            size: {
                value: { min: 1, max: 2.5 }
            }
        },
        detectRetina: particleCount > 40
    }

    if (particleCount <= 0 || !init) {
        return null
    }

    return (
        <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={options}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none'
            }}
        />
    )
}

export default ParticleNetwork
