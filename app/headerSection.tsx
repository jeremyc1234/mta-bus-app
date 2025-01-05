import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const LocationDropdown = dynamic(() => import("./locationDropdown"), {
    ssr: false,
});

interface HeaderSectionProps {
    selectedStop: string | null;
    onLocationChange: (location: { lat: number | null; lon: number | null }) => void;
    windowWidth: number;
    isLocationChanging: boolean;
    setIsLocationChanging: (value: boolean) => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
    selectedStop,
    onLocationChange,
    windowWidth,
    isLocationChanging,
    setIsLocationChanging
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const throttleTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const [lastStateChange, setLastStateChange] = useState(Date.now());
    const MIN_STATE_DURATION = 500; // milliseconds

    const handleScroll = useCallback(() => {
        // Only apply collapse behavior for screens smaller than desktop
        if (windowWidth >= 768) return;

        const currentScrollY = window.scrollY;
        const now = Date.now();

        if (now - lastStateChange < MIN_STATE_DURATION) return;

        if (throttleTimeout.current) {
            clearTimeout(throttleTimeout.current);
        }

        throttleTimeout.current = setTimeout(() => {
            // Check if user is at the top of the page
            const shouldBeCollapsed = currentScrollY > 0;
            
            if (shouldBeCollapsed !== isCollapsed) {
                setIsCollapsed(shouldBeCollapsed);
                setLastStateChange(now);
            }
        }, 200);
    }, [windowWidth, isCollapsed, lastStateChange]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
        };
    }, [handleScroll]);

    return (
        <div style={{
            minHeight: isCollapsed ? '0' : '60px',
            maxHeight: isCollapsed ? '0' : '200px',
            padding: isCollapsed ? '0' : '8px 0',
            position: 'relative',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            borderTop: "1px solid #e0e0e0",
            transform: `translateY(${isCollapsed ? '-1px' : '0'})`,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: windowWidth < 768 ? 'column' : 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                opacity: isCollapsed ? 0 : 1,
                transform: `translateY(${isCollapsed ? '-20px' : '0'})`,
                transition: 'all 0.3s ease',
                pointerEvents: isCollapsed ? 'none' : 'auto',
            }}>
                <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: windowWidth < 768 ? '10px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{ fontSize: '1.8rem' }}>🚌</span>
                    Bus routes near
                </span>

                <LocationDropdown
                    selectedStop={selectedStop}
                    onLocationChange={onLocationChange}
                    isLocationChanging={isLocationChanging}
                    setIsLocationChanging={setIsLocationChanging}
                />
            </div>
        </div>
    );
};

export default HeaderSection;