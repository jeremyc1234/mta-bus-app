import React, { useEffect, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import IssueBanner from "./issueBanner";

// Ensure LocationDropdown is only loaded client-side
const LocationDropdown = dynamic(() => import("./locationDropdown"), {
    ssr: false,
    loading: () => <div style={{ width: '300px', height: '38px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}></div>
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
    setIsLocationChanging,
}) => {
    const [isIssueBannerVisible, setIsIssueBannerVisible] = useState(false);
    const [isIssueBannerFadingOut, setIsIssueBannerFadingOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return (
        <>
            <div style={{
                minHeight: '60px',
                maxHeight: '200px',
                padding: '8px 0',
                position: 'relative',
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                overflow: 'visible',
                borderTop: "1px solid #e0e0e0",
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: windowWidth < 768 ? 'column' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    opacity: 1,
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease',
                }}>
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        marginBottom: windowWidth < 768 ? '10px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#3b3b3b',
                    }}>
                        <span style={{ fontSize: '1.8rem' }}>🚌</span>
                        Bus routes near
                    </span>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Suspense fallback={<div>Loading Location Dropdown...</div>}>
                            <LocationDropdown
                                onLocationChange={onLocationChange}
                                isLocationChanging={isLocationChanging}
                                setIsLocationChanging={setIsLocationChanging}
                            />
                        </Suspense>
                        <button
                            onClick={() => setIsIssueBannerVisible(!isIssueBannerVisible)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.25))'
                            }}
                            title="Show known issues"
                        >
                            ⚠️
                        </button>
                    </div>
                </div>
            </div>
            <IssueBanner 
                isVisible={isIssueBannerVisible} 
                onClose={() => setIsIssueBannerVisible(false)} 
            />
        </>
    );
};

// Memoize the component to prevent unnecessary rerenders
export default React.memo(HeaderSection);