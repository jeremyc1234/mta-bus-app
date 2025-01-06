import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface NavigationButtonsProps {
  stopName: string;
  lat: number;
  lon: number;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ stopName }) => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState({
    google: true, // Assume Next.js Image handles optimization
    apple: true,
  });

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const cleanStopName = (name: string) => {
    return encodeURIComponent(name.replace(/\//g, ' and '));
  };

  const openGoogleMaps = () => {
    console.log('Opening Google Maps with stop name:', stopName);
    const searchQuery = cleanStopName(`${stopName}, NYC`);
    const url = `https://www.google.com/maps/search/${searchQuery}`;
    window.open(url, '_blank');
  };

  const openAppleMaps = () => {
    console.log('Opening Apple Maps with stop name:', stopName);
    const searchQuery = cleanStopName(`${stopName}, NYC`);
    const url = `maps://maps.apple.com/?q=${searchQuery}`;
    window.open(url, '_blank');
  };

  const buttonStyle = {
    display: 'inline-block',
    borderRadius: '0',
    padding: '0',
    overflow: 'visible',
    cursor: 'pointer',
  };

  const imageWrapperStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '25px',
    height: '25px',
    boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)', // Shadow applied here
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const fallbackStyle = {
    fontSize: '20px',
    width: '25px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        onClick={openGoogleMaps}
        role="button"
        tabIndex={0}
        title="Open in Google Maps"
        style={buttonStyle}
      >
        <div style={imageWrapperStyle}>
          <Image
            src="/icons/google_maps_icon.png"
            alt="Google Maps"
            width={25}
            height={25}
            priority
          />
        </div>
        {!imagesLoaded.google && <span style={fallbackStyle}>🗺️ Google Maps</span>}
      </div>

      {isIOS && (
        <div
          onClick={openAppleMaps}
          role="button"
          tabIndex={0}
          title="Open in Apple Maps"
          style={buttonStyle}
        >
          <div style={imageWrapperStyle}>
            <Image
              src="/icons/apple_maps_icon.png"
              alt="Apple Maps"
              width={25}
              height={25}
              priority
            />
          </div>
          {!imagesLoaded.apple && <span style={fallbackStyle}>🗺️ Apple Maps</span>}
        </div>
      )}
    </div>
  );
};

export default NavigationButtons;