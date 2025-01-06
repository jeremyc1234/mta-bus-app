import React, { useEffect, Suspense } from "react";
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
    useEffect(() => {
        // Ensure header remains visible on desktop and mobile
        if (windowWidth >= 768) {
            document.body.style.paddingTop = "0px";
        }
    }, [windowWidth]);

    return (
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
                }}>
                    <span style={{ fontSize: '1.8rem' }}>🚌</span>
                    Bus routes near
                </span>
                <Suspense fallback={<div>Loading Location Dropdown...</div>}>
                    <LocationDropdown
                        selectedStop={selectedStop}
                        onLocationChange={onLocationChange}
                        isLocationChanging={isLocationChanging}
                        setIsLocationChanging={setIsLocationChanging}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default HeaderSection;
