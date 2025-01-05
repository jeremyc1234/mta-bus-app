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

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div onClick={openGoogleMaps} role="button" tabIndex={0} title="Open in Google Maps">
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
        <div onClick={openAppleMaps} role="button" tabIndex={0} title="Open in Apple Maps">
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