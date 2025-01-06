import React, { useState, useEffect } from 'react';

interface NavigationButtonsProps {
  stopName: string;
  lat: number;  // keeping these for backward compatibility
  lon: number;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ stopName }) => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState({
    google: false,
    apple: false,
  });

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const googleIcon = new Image();
    const appleIcon = new Image();

    googleIcon.onload = () => setImagesLoaded((prev) => ({ ...prev, google: true }));
    appleIcon.onload = () => setImagesLoaded((prev) => ({ ...prev, apple: true }));

    googleIcon.src = '/icons/google_maps_icon.png';
    appleIcon.src = '/icons/apple_maps_icon.png';
  }, []);

  const cleanStopName = (name: string) => {
    // Replace slashes with "and" and encode for URL
    return encodeURIComponent(name.replace(/\//g, ' and '));
  };

  const openGoogleMaps = () => {
    console.log('Opening Google Maps with stop name:', stopName);
    const searchQuery = cleanStopName(stopName);
    console.log('search query',searchQuery);
    const url = `https://www.google.com/maps/search/${searchQuery}`;
    window.open(url, '_blank');
  };

  const openAppleMaps = () => {
    console.log('Opening Apple Maps with stop name:', stopName);
    const searchQuery = cleanStopName(stopName);
    const url = `maps://maps.apple.com/?q=${searchQuery}+NYC`;
    window.open(url, '_blank');
  };

  const handleImageError = (type: 'google' | 'apple') => {
    setImagesLoaded((prev) => ({ ...prev, [type]: false }));
  };
  
  const iconStyle = {
    width: '25px',
    height: '25px',
    cursor: 'pointer',
    display: 'block',
    boxShadow: 'inherit', // Inherit the shadow from the button
  };

  const fallbackStyle = {
    fontSize: '20px',
    width: '25px',
    height: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const buttonStyle = {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Drop shadow effect directly on the icon
    display: 'inline-block',
    borderRadius: '0', // Ensure no border radius
    padding: '0', // Remove any padding
    overflow: 'visible', // Ensure no clipping of shadow
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
        {imagesLoaded.google ? (
          <img
            src="/icons/google_maps_icon.png"
            alt="Google Maps"
            onError={() => handleImageError('google')}
            style={iconStyle}
          />
        ) : (
          <span style={fallbackStyle}>🗺️</span>
        )}
      </div>

      {isIOS && (
        <div
          onClick={openAppleMaps}
          role="button"
          tabIndex={0}
          title="Open in Apple Maps"
          style={buttonStyle}
        >
          {imagesLoaded.apple ? (
            <img
              src="/icons/apple_maps_icon.png"
              alt="Apple Maps"
              onError={() => handleImageError('apple')}
              style={iconStyle}
            />
          ) : (
            <span style={fallbackStyle}>🗺️</span>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationButtons;