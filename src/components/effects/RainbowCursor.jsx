'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * RainbowCursor - Creates a rainbow shopping bag cursor trail with physics and sparkles
 * Optimized version using Canvas for better performance
 */
const RainbowCursor = ({ iconType = 'bag', performanceProfile = null }) => {
    // Use refs instead of state to avoid unnecessary re-renders
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const mousePosition = useRef({ x: 0, y: 0 });
    const lastBagTime = useRef(0);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationRef = useRef();
    const colorIndex = useRef(0);
    const bagsRef = useRef([]);
    const sparklesRef = useRef([]);
    const performanceRef = useRef({
        // Default settings
        MAX_BAGS: 15,
        MAX_SPARKLES: 20,
        SPAWN_INTERVAL: 80,
        ENABLE_SPARKLES: true,
        ENABLE_PULSE: true
    });

    // Rainbow colors array
    const rainbowColors = [
        '#FFB3B3', // Light Red / Pink
        '#FFDDAA', // Light Orange / Peach
        '#FFFFB3', // Light Yellow
        '#B3FFB3', // Light Green
        '#B3B3FF', // Light Blue / Periwinkle
        '#C8A2C8', // Light Indigo / Lilac
        '#E6B3E6'  // Light Violet / Mauve
    ];

    // Sparkle shapes
    const sparkleShapes = ['★', '✦', '✧', '✩', '✫', '♦', '❋', '•'];

    // Initialize canvas and detect device capabilities
    const setupCanvas = useCallback(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        contextRef.current = canvas.getContext('2d');
        
        // Set performance parameters based on profile and icon type
        if (performanceProfile) {
            // Apply performance profile settings
            if (performanceProfile.cursorProfile === 'none') {
                performanceRef.current = {
                    MAX_BAGS: 0,
                    MAX_SPARKLES: 0,
                    SPAWN_INTERVAL: 1000,
                    ENABLE_SPARKLES: false,
                    ENABLE_PULSE: false
                };
            } else if (performanceProfile.cursorProfile === 'light') {
                performanceRef.current = {
                    MAX_BAGS: 8,
                    MAX_SPARKLES: 0,
                    SPAWN_INTERVAL: 150,
                    ENABLE_SPARKLES: false,
                    ENABLE_PULSE: false
                };
            } else {
                // Standard performance options based on other settings
                performanceRef.current = {
                    MAX_BAGS: performanceProfile.enableBackgroundEffects ? 15 : 10,
                    MAX_SPARKLES: performanceProfile.enableBackgroundEffects ? 20 : 0,
                    SPAWN_INTERVAL: performanceProfile.enableAnimations ? 80 : 120,
                    ENABLE_SPARKLES: performanceProfile.enableBackgroundEffects,
                    ENABLE_PULSE: performanceProfile.enableAnimations
                };
            }
        } else {
            // Apply optimizations based on icon type
            if (iconType === 'light-bag') {
                performanceRef.current = {
                    MAX_BAGS: 8,
                    MAX_SPARKLES: 0,
                    SPAWN_INTERVAL: 150,
                    ENABLE_SPARKLES: false,
                    ENABLE_PULSE: false
                };
            }
            else {
                // Detect device capabilities and adjust performance settings
                const isLowPower = window.navigator.hardwareConcurrency <= 4;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isLowPower || isMobile) {
                    performanceRef.current = {
                        MAX_BAGS: 10,
                        MAX_SPARKLES: 10,
                        SPAWN_INTERVAL: 120,
                        ENABLE_SPARKLES: false,
                        ENABLE_PULSE: false
                    };
                } else {
                    // For mid-range devices, reduce some effects
                    const isHighPerformance = window.navigator.hardwareConcurrency > 8;
                    if (!isHighPerformance) {
                        performanceRef.current = {
                            MAX_BAGS: 15,
                            MAX_SPARKLES: 15,
                            SPAWN_INTERVAL: 100,
                            ENABLE_SPARKLES: true,
                            ENABLE_PULSE: false
                        };
                    }
                }
            }
        }
        
        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [iconType, performanceProfile]);

    // Don't run any animations if iconType is 'none'
    useEffect(() => {
        if (iconType === 'none') return;
        
        const cleanup = setupCanvas();
        
        const handleMouseMove = (event) => {
            mousePosition.current = { x: event.clientX, y: event.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Handle visibility changes to pause animation when tab is not visible
        const handleVisibilityChange = () => {
            if (document.hidden) {
                cancelAnimationFrame(animationRef.current);
            } else {
                if (!animationRef.current) {
                    startAnimation();
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Start animation
        startAnimation();

        // Clean up when component unmounts
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationRef.current);
            if (cleanup) cleanup();
        };
    }, [iconType, setupCanvas]);

    // Main animation loop using Canvas
    const startAnimation = useCallback(() => {
        const animate = (timestamp) => {
            if (!contextRef.current || !canvasRef.current) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            
            const ctx = contextRef.current;
            const canvas = canvasRef.current;
            
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const currentPosition = mousePosition.current;
            const perf = performanceRef.current;

            // Calculate distance moved
            const distMoved = Math.sqrt(
                Math.pow(currentPosition.x - lastPosition.current.x, 2) +
                Math.pow(currentPosition.y - lastPosition.current.y, 2)
            );

            // Only spawn new bag if:
            // 1. Mouse has moved sufficient distance
            // 2. Enough time has passed since last bag
            if (distMoved > 5 && timestamp - lastBagTime.current > perf.SPAWN_INTERVAL) {
                // Create a new bag at current position with slight offset
                const newBag = {
                    id: Date.now(),
                    x: currentPosition.x - 10,
                    y: currentPosition.y + 10,
                    rotation: Math.random() * 30 - 15,
                    velocityY: 0,
                    velocityX: (Math.random() - 0.5) * 0.5,
                    baseSize: Math.random() * 0.2 + 0.6,
                    size: Math.random() * 0.2 + 0.6,
                    opacity: 1,
                    color: rainbowColors[colorIndex.current],
                    borderColor: rainbowColors[(colorIndex.current + 1) % rainbowColors.length],
                    createdAt: timestamp,
                    spinSpeed: (Math.random() - 0.5) * 5,
                    hasPulse: perf.ENABLE_PULSE && Math.random() > 0.7,
                    hasSquish: perf.ENABLE_PULSE && Math.random() > 0.5,
                    maxSize: Math.random() * 1.2 + 1.6,
                    growthRate: Math.random() * 0.008 + 0.002,
                    nextSparkleTime: timestamp + Math.random() * 500
                };

                // Update for next bag
                lastBagTime.current = timestamp;
                lastPosition.current = { ...currentPosition };
                colorIndex.current = (colorIndex.current + 1) % rainbowColors.length;

                // Add new bag to the array
                bagsRef.current = [newBag, ...bagsRef.current].slice(0, perf.MAX_BAGS);
            }

            // Update and render bags
            const updatedBags = [];
            
            for (const bag of bagsRef.current) {
                // Calculate age of bag
                const age = timestamp - bag.createdAt;

                // Apply gravity - bags accelerate downward over time
                const newVelocityY = bag.velocityY + 0.07;

                // Update position based on velocity
                const newY = bag.y + newVelocityY;
                const newX = bag.x + bag.velocityX;

                // Fade out based on age (fully fade after 3 seconds)
                const newOpacity = Math.max(0, 1 - (age / 3000));
                
                if (newOpacity <= 0) continue; // Skip rendering if fully transparent

                // Gradually increase size over time, up to max size
                const newSize = Math.min(bag.maxSize, bag.size + bag.growthRate * bag.velocityY);

                // Calculate rotation - spinning gets faster as bag falls
                const newRotation = (bag.rotation + bag.spinSpeed * (1 + bag.velocityY / 10)) % 360;

                // Pulse effect for some bags
                let pulseEffect = 1;
                if (bag.hasPulse) {
                    pulseEffect = 1 + Math.sin(age / 120) * 0.15;
                }

                // Squish effect - bags get squished as they fall faster
                let squishX = 1;
                let squishY = 1;
                if (bag.hasSquish && bag.velocityY > 1) {
                    const squishFactor = Math.min(1.4, 1 + (bag.velocityY * 0.03));
                    squishX = 1 / squishFactor;
                    squishY = squishFactor;
                }

                // Generate sparkles on a timer
                let updatedSparkleTime = bag.nextSparkleTime;
                if (perf.ENABLE_SPARKLES && bag.nextSparkleTime <= timestamp && newOpacity > 0.5) {
                    // Create new sparkle using requestIdleCallback when available
                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(() => {
                            const sparkleSize = Math.random() * 0.4 + 0.2;
                            const sparkleAngle = Math.random() * Math.PI * 2;
                            const sparkleDistance = Math.random() * 30 + 5;
                            const sparkle = {
                                id: Date.now() + Math.random(),
                                x: newX + Math.cos(sparkleAngle) * sparkleDistance,
                                y: newY + Math.sin(sparkleAngle) * sparkleDistance,
                                size: sparkleSize,
                                opacity: Math.random() * 0.3 + 0.7,
                                color: bag.color,
                                rotation: Math.random() * 360,
                                shape: sparkleShapes[Math.floor(Math.random() * sparkleShapes.length)],
                                createdAt: timestamp,
                                duration: Math.random() * 1500 + 500
                            };
                            
                            sparklesRef.current = [sparkle, ...sparklesRef.current].slice(0, perf.MAX_SPARKLES);
                        });
                    } else {
                        // Fallback for browsers without requestIdleCallback
                        const sparkleSize = Math.random() * 0.4 + 0.2;
                        const sparkleAngle = Math.random() * Math.PI * 2;
                        const sparkleDistance = Math.random() * 30 + 5;
                        const sparkle = {
                            id: Date.now() + Math.random(),
                            x: newX + Math.cos(sparkleAngle) * sparkleDistance,
                            y: newY + Math.sin(sparkleAngle) * sparkleDistance,
                            size: sparkleSize,
                            opacity: Math.random() * 0.3 + 0.7,
                            color: bag.color,
                            rotation: Math.random() * 360,
                            shape: sparkleShapes[Math.floor(Math.random() * sparkleShapes.length)],
                            createdAt: timestamp,
                            duration: Math.random() * 1500 + 500
                        };
                        
                        sparklesRef.current = [sparkle, ...sparklesRef.current].slice(0, perf.MAX_SPARKLES);
                    }

                    // Schedule next sparkle
                    updatedSparkleTime = timestamp + Math.random() * 700 + 300;
                }

                // Save the updated bag
                if (newOpacity > 0) {
                    updatedBags.push({
                        ...bag,
                        y: newY,
                        x: newX,
                        velocityY: newVelocityY,
                        velocityX: bag.velocityX * 0.99,
                        opacity: newOpacity,
                        size: newSize,
                        rotation: newRotation,
                        pulseEffect,
                        squishX,
                        squishY,
                        nextSparkleTime: updatedSparkleTime
                    });
                }
                
                // Draw the bag on canvas
                drawIcon(ctx, {
                    ...bag,
                    y: newY,
                    x: newX,
                    opacity: newOpacity,
                    size: newSize * pulseEffect,
                    squishX,
                    squishY,
                    rotation: newRotation
                }, iconType);
            }
            
            // Update bags reference
            bagsRef.current = updatedBags;

            // Update and render sparkles
            const updatedSparkles = [];
            
            for (const sparkle of sparklesRef.current) {
                const age = timestamp - sparkle.createdAt;
                const lifePercent = age / sparkle.duration;

                // Skip if expired
                if (lifePercent >= 1) continue;

                // Fade in and out
                let newOpacity = sparkle.opacity;
                if (lifePercent < 0.3) {
                    // Fade in
                    newOpacity = (lifePercent / 0.3) * sparkle.opacity;
                } else if (lifePercent > 0.7) {
                    // Fade out
                    newOpacity = (1 - ((lifePercent - 0.7) / 0.3)) * sparkle.opacity;
                }

                // Draw sparkle
                drawSparkle(ctx, {
                    ...sparkle,
                    opacity: newOpacity,
                    rotation: sparkle.rotation + 1
                });

                // Save updated sparkle
                updatedSparkles.push({
                    ...sparkle,
                    opacity: newOpacity,
                    rotation: sparkle.rotation + 1
                });
            }
            
            // Update sparkles reference
            sparklesRef.current = updatedSparkles;

            // Continue animation loop
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [iconType, rainbowColors, sparkleShapes]);

    // Draw functions for Canvas rendering
    const drawIcon = (ctx, bag, iconType) => {
        const { x, y, size, rotation, opacity, color, borderColor, squishX, squishY } = bag;
        
        if (opacity <= 0.01) return;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(size * squishX, size * squishY);
        
        // Change path based on icon type
        switch (iconType) {
            case 'bag':
                // Shopping bag icon
                ctx.beginPath();
                // Border
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = color;
                
                // Draw shopping bag
                ctx.moveTo(-8, -10);
                ctx.lineTo(-8, 5);
                ctx.lineTo(8, 5);
                ctx.lineTo(8, -10);
                ctx.lineTo(4, -10);
                ctx.lineTo(4, -16);
                ctx.lineTo(-4, -16);
                ctx.lineTo(-4, -10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Draw bag details (handles)
                ctx.beginPath();
                ctx.rect(-5, -8, 2, 2);
                ctx.rect(3, -8, 2, 2);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'light-bag':
                // Simplified bag icon for better performance
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.strokeStyle = 'transparent';
                ctx.globalAlpha = opacity * 0.7; // Lighter opacity for performance mode
                
                // Simple rectangle shape for the bag
                ctx.fillRect(-6, -12, 12, 15);
                break;
                
            case 'star':
                // Star icon
                ctx.beginPath();
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = color;
                
                // Draw 5-point star
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const innerAngle = angle + Math.PI / 5;
                    
                    if (i === 0) {
                        ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                    } else {
                        ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                    }
                    
                    ctx.lineTo(Math.cos(innerAngle) * 4, Math.sin(innerAngle) * 4);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'heart':
                // Heart icon
                ctx.beginPath();
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = color;
                
                // Draw heart
                ctx.moveTo(0, 3);
                ctx.bezierCurveTo(0, 2, -1, -1, -8, -1);
                ctx.bezierCurveTo(-15, -1, -8, 10, 0, 15);
                ctx.bezierCurveTo(8, 10, 15, -1, 8, -1);
                ctx.bezierCurveTo(1, -1, 0, 2, 0, 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'circle':
                // Circle icon
                ctx.beginPath();
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = color;
                
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
                
            default:
                // Default to bag
                ctx.beginPath();
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = color;
                
                // Draw shopping bag
                ctx.moveTo(-8, -10);
                ctx.lineTo(-8, 5);
                ctx.lineTo(8, 5);
                ctx.lineTo(8, -10);
                ctx.lineTo(4, -10);
                ctx.lineTo(4, -16);
                ctx.lineTo(-4, -16);
                ctx.lineTo(-4, -10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Draw bag details
                ctx.beginPath();
                ctx.rect(-5, -8, 2, 2);
                ctx.rect(3, -8, 2, 2);
                ctx.fill();
                ctx.stroke();
        }
        
        ctx.restore();
    };

    const drawSparkle = (ctx, sparkle) => {
        const { x, y, size, rotation, opacity, color, shape } = sparkle;
        
        if (opacity <= 0.01) return;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Draw the sparkle text
        ctx.font = `${size * 24}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape, 0, 0);
        
        ctx.restore();
    };

    // If icon type is none, don't render anything
    if (iconType === 'none') return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};

export default RainbowCursor; 