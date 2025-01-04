import React, { useEffect } from 'react';

interface LocationChangeAnimationProps {
  isVisible: boolean;
}

const LocationChangeAnimation: React.FC<LocationChangeAnimationProps> = ({ isVisible }) => {
  console.log('🖥️ LocationChangeAnimation Rendered - isVisible:', isVisible);

  useEffect(() => {
    console.log('🎬 LocationChangeAnimation Mounted');
    return () => {
      console.log('🏁 LocationChangeAnimation Unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('🚦 isVisible changed to:', isVisible);
    if (isVisible) {
      console.log('🚀 Animation Started');
    } else {
      console.log('🛑 Animation Ended');
    }
  }, [isVisible]);

  return (
    <div style={{
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease-in-out',
      marginTop: "10px",
      position: "relative",
      zIndex: 9999,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
    }}>
      <div className="w-full h-20 relative overflow-hidden my-4">
        {/* Background rainbow gradient */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-50"></div>
        </div>
        
        {/* Text behind the bus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-600 text-xl font-semibold">Changing location...</span>
        </div>
        
        {/* Animated bus */}
        <div className="absolute inset-0 flex items-center">
          <div className="animate-bus-slide w-full">
            <img 
              src="/icons/bus_icon.png" 
              alt="Moving bus" 
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        
        <style jsx>{`
          .animate-bus-slide {
            animation: busSlide 2s linear forwards;
          }
          
          @keyframes busSlide {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LocationChangeAnimation;