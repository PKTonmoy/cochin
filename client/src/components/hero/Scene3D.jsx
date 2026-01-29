import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'

// Floating 3D Geometric Shape Component
const FloatingShape = ({ position, geometry, color, scale = 1, speed = 1 }) => {
    const meshRef = useRef()
    const initialY = position[1]

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.x += 0.002 * speed
            meshRef.current.rotation.y += 0.003 * speed

            // Floating motion
            meshRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.25
        }
    })

    const geometryComponent = useMemo(() => {
        switch (geometry) {
            case 'icosahedron':
                return <icosahedronGeometry args={[0.5 * scale, 0]} />
            case 'octahedron':
                return <octahedronGeometry args={[0.5 * scale, 0]} />
            case 'tetrahedron':
                return <tetrahedronGeometry args={[0.5 * scale, 0]} />
            case 'dodecahedron':
                return <dodecahedronGeometry args={[0.4 * scale, 0]} />
            default:
                return <boxGeometry args={[0.4 * scale, 0.4 * scale, 0.4 * scale]} />
        }
    }, [geometry, scale])

    return (
        <Float speed={speed * 0.5} rotationIntensity={0.4} floatIntensity={0.4}>
            <mesh ref={meshRef} position={position}>
                {geometryComponent}
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.75}
                    wireframe={false}
                />
            </mesh>
        </Float>
    )
}

// Dynamic 3D Scene Component - adjusts based on performance tier
const Scene3D = ({ mousePosition, shapeCount = 12, starCount = 800 }) => {
    const groupRef = useRef()

    // Generate shapes based on performance tier
    const shapes = useMemo(() => {
        const geometries = ['icosahedron', 'octahedron', 'tetrahedron', 'dodecahedron']
        // Updated to website color theme: Sky Blue & Orange
        const colors = ['#2E86AB', '#F5A623', '#3498db', '#5DADE2', '#E67E22']

        return Array.from({ length: shapeCount }, (_, i) => ({
            id: i,
            position: [
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 5 - 3
            ],
            geometry: geometries[i % geometries.length],
            color: colors[i % colors.length],
            scale: 0.5 + Math.random() * 0.8,
            speed: 0.2 + Math.random() * 0.4
        }))
    }, [shapeCount])

    // Subtle camera movement based on mouse
    useFrame(() => {
        if (groupRef.current && mousePosition) {
            const targetX = (mousePosition.x - 0.5) * 0.4
            const targetY = (mousePosition.y - 0.5) * -0.25

            groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.015
            groupRef.current.rotation.x += (targetY - groupRef.current.rotation.x) * 0.015
        }
    })

    return (
        <>
            {/* Balanced lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} />
            {shapeCount > 4 && (
                <>
                    <pointLight position={[-8, 0, 5]} intensity={0.4} color="#2E86AB" />
                    <pointLight position={[8, 5, -5]} intensity={0.3} color="#F5A623" />
                </>
            )}

            {/* Stars based on performance tier */}
            {starCount > 0 && (
                <Stars
                    radius={40}
                    depth={30}
                    count={starCount}
                    factor={2.5}
                    saturation={0}
                    fade
                    speed={0.3}
                />
            )}

            {/* Floating shapes group */}
            <group ref={groupRef}>
                {shapes.map((shape) => (
                    <FloatingShape
                        key={shape.id}
                        position={shape.position}
                        geometry={shape.geometry}
                        color={shape.color}
                        scale={shape.scale}
                        speed={shape.speed}
                    />
                ))}
            </group>
        </>
    )
}

export default Scene3D
