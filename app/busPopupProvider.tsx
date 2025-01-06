import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
} from 'react';
import { useLockBodyScroll } from '@uidotdev/usehooks';
import Image from 'next/image';


const RainbowAnimation = `
  @keyframes rainbowMove {
    to { background-position: 0 200% }
  }
  
  @keyframes driveDown {
    from { top: 0%; }
    to { top: var(--final-position); }
  }
`;

interface BusInfo {
  route: string;
  stops: string[];
  currentStop: number;
  destination: string;
  userLocation?: string;
  tileStopName: string;
  stopsAway: number;
  vehicleRef?: string; // Add vehicleRef
}


interface BusPopupContextType {
  showBusInfo: (info: BusInfo) => void;
  hideBusInfo: () => void;
}

interface BusRoutePopupProps {
  route: string;
  stops: string[];
  currentStop: number;
  destination: string;
  onClose: () => void;
  userLocation?: string;
  tileStopName: string;
  stopsAway: number;
  vehicleRef?: string; // Add vehicleRef
}

interface BusContentProps {
  children: (showBusInfo: (
    route: string,
    stops: string[],
    currentStop: number,
    destination: string,
    tileStopName: string,
    userLocation?: string,
    stopsAway?: number,
    vehicleRef?: string // ✅ Add vehicleRef here
  ) => void) => React.ReactNode;
}

const BusPopupContext = createContext<BusPopupContextType | null>(null);

const BusRoutePopup = memo(({
  route,
  stops,
  currentStop,
  destination,
  onClose,
  userLocation,
  tileStopName,
  stopsAway,
}: BusRoutePopupProps) => {useEffect(() => {
    // console.log('🛑 Stops Away in Popup:', stopsAway);
  }, [stopsAway]);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [stopPosition, setStopPosition] = useState<'above' | 'below' | 'visible'>('below');

  useLockBodyScroll();

  const isGoingUp = useMemo(() => {
    return currentStop > stops.length / 2;
  }, [currentStop, stops.length]);

  const busIcon = useMemo(() =>
    isGoingUp ? "/icons/bus_up.png" : "/icons/bus_down.png",
    [isGoingUp]
  );

  const adjustedStops = useMemo(() => {
    let stopsToUse = [...stops]; // Create a copy to avoid modifying original
    
    // Check if the tileStopName exists in the current stop list
    const tileStopExists = stopsToUse.includes(tileStopName);
    
    if (!tileStopExists) {
      console.warn(
        `Tile stop "${tileStopName}" not found in current stops list. Attempting to switch direction.`
      );
  
      // Check if there's an alternate direction
      stopsToUse.reverse();
      const tileStopInAlternate = stopsToUse.includes(tileStopName);
  
      if (!tileStopInAlternate) {
        console.warn('Tile stop not found in either direction.');
        stopsToUse = stops; // Reset to original if not found
      }
    }
  
    // Ensure furthest stop is at the bottom by maintaining correct order
    const isUptown = currentStop > stopsToUse.length / 2;
    return isUptown ? stopsToUse.reverse() : stopsToUse;
  }, [stops, tileStopName, currentStop]);

  const estimatedStopIndex = useMemo(() => {
    const closestStopIndex = adjustedStops.findIndex(stop => stop === tileStopName);
    if (closestStopIndex === -1 || stopsAway < 0) return -1;
    return Math.max(0, closestStopIndex - stopsAway);
  }, [adjustedStops, tileStopName, stopsAway]);

  const busPosition = useMemo(() => {
    // Use estimatedStopIndex if valid; otherwise, fallback to currentStop
    const busStopIndex = estimatedStopIndex !== -1 ? estimatedStopIndex : currentStop;
  
    // Ensure the index is within bounds
    const clampedIndex = Math.max(0, Math.min(busStopIndex, adjustedStops.length - 1));
  
    // Calculate the position as a percentage
    return (clampedIndex / (adjustedStops.length - 1)) * 100;
  }, [adjustedStops, estimatedStopIndex, currentStop]);

  // Stable scroll handler using ref
  const handleScroll = useCallback((event: Event) => {
    const scrollEl = event.target as HTMLDivElement;
    if (!scrollEl?.children) return;
  
    const closestStopElement = Array.from(scrollEl.querySelectorAll('div[data-stop]'))
      .find(div => div.textContent?.includes('(Closest stop to you)'));
  
    if (closestStopElement) {
      const rect = closestStopElement.getBoundingClientRect();
      const containerRect = scrollEl.getBoundingClientRect();
  
      // Check if the stop is fully or partially visible in the viewport
      const isVisible =
        rect.top < containerRect.bottom && rect.bottom > containerRect.top;
  
      if (isVisible) {
        setStopPosition('visible');
      } else if (rect.top < containerRect.top) {
        setStopPosition('above');
      } else {
        setStopPosition('below');
      }
    }
  }, []);

  BusRoutePopup.displayName = 'BusRoutePopup';

  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollEl = scrollableRef.current;
      if (!scrollEl) return;
  
      const targetDiv = Array.from(scrollEl.querySelectorAll('div[data-stop]'))
        .find(div => div.getAttribute('data-stop') === adjustedStops[estimatedStopIndex]);
  
      if (targetDiv) {
        targetDiv.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center' 
        });
      }
    }, 100);
  
    return () => clearTimeout(timer);
  }, [tileStopName, estimatedStopIndex, adjustedStops]);


  // Set up scroll listener
  useEffect(() => {
    const scrollEl = scrollableRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', handleScroll);
    handleScroll({ target: scrollEl } as unknown as Event);

    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  
  const stopsList = useMemo(() => (
    adjustedStops.map((stop: string, index: number) => {
      const isUserStop = stop === userLocation;
      const isCurrentStop = index === currentStop;
      const isTileStop = stop === tileStopName;
      const isEstimatedStop = index === estimatedStopIndex;
  
      let backgroundColor = 'transparent';
  
      if (isUserStop && isCurrentStop) {
        backgroundColor = '#e6f7ff'; // Light blue when closest stop and MTA-provided stop match
      } else if (isUserStop) {
        backgroundColor = '#e6f7ff'; // Light orange for closest stop
      } else if (isCurrentStop) {
        backgroundColor = '#FFEE93'; // Yellow for MTA-provided stop
      } else if (isTileStop) {
        backgroundColor = '#e6f7ff'; // Light blue for tile-selected stop
      } else if (isEstimatedStop) {
        backgroundColor = '#FFD700'; // Gold for estimated stop
      }
  
      return (
        <div
          key={`${stop}-${index}`}
          data-stop={stop}
          style={{
            fontWeight: 'bold',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor,
            marginBottom: '8px',
            transition: 'background-color 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <span>{stop}</span>
  
          {isCurrentStop && (
            <span style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
              (MTA provided bus location)
            </span>
          )}
          {isTileStop && (
            <span style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
              (Closest stop to you)
            </span>
          )}
          {isEstimatedStop && (
            <span style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
              (Our estimated bus location)
            </span>
          )}
        </div>
      );
    })
  ), [adjustedStops, userLocation, currentStop, tileStopName, estimatedStopIndex]);
  
const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
}, [onClose]);

const [showDriveAnimation, setShowDriveAnimation] = useState(true);

useEffect(() => {
  setShowDriveAnimation(true);
  // Start animation immediately
  requestAnimationFrame(() => setShowDriveAnimation(false));
}, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
          ...(typeof window !== 'undefined' && window.innerWidth > 768
            ? { maxWidth: '600px' } // Wider popup for desktop
            : {}),
        }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          flex: 'none',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            ←
          </button>
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>
            Route {route}
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
              to {destination}
            </div>
          </h2>
        </div>

        <div
          ref={scrollableRef}
          style={{
            flex: '1',
            overflowY: 'auto',
            padding: '20px',
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            scrollbarWidth: 'thin',
            maxHeight: 'calc(100% - 60px)',
          }}
        >
          {/* Inside BusRoutePopup component */}
          <div style={{ display: 'flex', gap: '20px', height: 'auto', minHeight: '100%' }}>
  {/* Bus Icon and Rainbow */}
<div style={{ 
  display: 'flex', 
  flexDirection: 'column',
  position: 'relative',
  marginLeft: '5px',
  marginRight: '10px',
  alignItems: 'center'
}}>
  {/* Bus Icon */}
  <div style={{
    position: 'absolute',
    top: showDriveAnimation ? '0%' : `${busPosition}%`,
    width: '40px',
    height: '150px',
    transform: 'translateY(-50%)',
    zIndex: 2,
    left: '0px', // Align bus and rainbow to the same starting point
    transition: 'top 1s ease-in-out',
  }}>
    <style>{RainbowAnimation}</style>
    {/* Rainbow Trail */}
    <div style={{
      width: '20px',
      height: '405px',
      top: '-400px',
      left: '0px', // Ensure alignment with the bus icon
      background: `linear-gradient(${isGoingUp ? '0deg' : '180deg'}, 
        rgba(255,0,0,1) 0%, 
        rgba(255,154,0,1) 10%, 
        rgba(208,222,33,1) 20%, 
        rgba(79,220,74,1) 30%, 
        rgba(63,218,216,1) 40%, 
        rgba(47,201,226,1) 50%, 
        rgba(28,127,238,1) 60%, 
        rgba(95,21,242,1) 70%, 
        rgba(186,12,248,1) 80%, 
        rgba(251,7,217,1) 90%, 
        rgba(255,0,0,1) 100%)`,
      backgroundSize: '100% 200%',
      animation: 'rainbowMove 2s linear infinite',
      position: 'absolute',
      zIndex: 1,
      WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%)',
      maskImage: 'linear-gradient(to bottom, transparent, black 30%)'
    }} />
    <Image
      src={busIcon}
      alt={isGoingUp ? 'Bus going up' : 'Bus going down'}
      width={80}
      height={120}
      style={{
        objectFit: 'contain',
        position: 'relative',
        zIndex: 3,
        marginLeft: '-30px'
      }}
    />
  </div>
</div>

  {/* Blue Line */}
  <div style={{
    width: '2px',
    backgroundColor: '#0078D7',
    position: 'relative',
    minHeight: '100%',
    height: 'auto',
    zIndex: 0,
    marginRight: '5px' // Adds spacing between the line and stops
  }} />

  {/* Stops List */}
<div style={{ flex: 1 }}>
  {stopsList}
</div>
</div>
</div>

{/* Gradient Shadow and Down Caret */}
{estimatedStopIndex !== -1 && (
  <div
    style={{
      position: 'absolute',
      ...(stopPosition === 'above'
        ? { top: '120px' } // Start below the header
        : { bottom: 0 }),
      left: 0,
      right: 0,
      height: '150px',
      background: stopPosition === 'above'
        ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0))'
        : 'linear-gradient(to top, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0))',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: stopPosition === 'above' ? 'flex-start' : 'flex-end',
      alignItems: 'center',
      zIndex: 10,
      pointerEvents: 'none',
      padding: stopPosition === 'above' ? '0' : '20px 0',
      opacity: stopPosition === 'visible' ? 0 : 1, // Fade in/out
      transition: 'opacity 0.5s ease-in-out', // Smooth fade transition
    }}
  >
    {/* "Your Stop" Text */}
    <span
      style={{
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: '1rem',
        margin: stopPosition === 'above' ? '20px 0 8px' : '8px 0 10px',
        zIndex: 11,
        pointerEvents: 'none',
        opacity: stopPosition === 'visible' ? 0 : 1, // Fade in/out
        transition: 'opacity 0.5s ease-in-out', // Smooth fade transition
      }}
    >
      Your Stop
    </span>

    {/* Caret Icon */}
    <Image
      src={stopPosition === 'above' ? '/icons/up_caret.png' : '/icons/down_caret.png'}
      alt={stopPosition === 'above' ? 'Scroll Up' : 'Scroll Down'}
      width={60}
      height={24}
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 11,
        margin: stopPosition === 'above' ? '8px 0 0' : '0 0 20px',
        opacity: stopPosition === 'visible' ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
      }}
      onClick={() => {
        if (scrollableRef.current) {
          const scrollEl = scrollableRef.current;
          const closestStopDiv = Array.from(
            scrollEl.querySelectorAll('div[data-stop]')
          ).find((div) => div.textContent?.includes('(Closest stop to you)'));

          if (closestStopDiv) {
            closestStopDiv.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      }}
    />
  </div>
)}
</div>
</div>
  );
});

export const BusContent: React.FC<BusContentProps> = ({ children }) => {
  const { showBusInfo } = useBusPopup();

  const wrappedShowBusInfo = useCallback((
    route: string,
    stops: string[],
    currentStop: number,
    destination: string,
    tileStopName: string,
    userLocation?: string,
    stopsAway: number = 0,
    vehicleRef?: string // Add vehicleRef
  ) => {
    showBusInfo({
      route,
      stops,
      currentStop,
      destination,
      userLocation,
      tileStopName,
      stopsAway,
      vehicleRef // Pass vehicleRef
    });
  }, [showBusInfo]);

  return <>{children(wrappedShowBusInfo)}</>;
};

export const BusPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);

  const showBusInfo = useCallback((info: BusInfo) => {
    setBusInfo(info);
  }, []);

  const hideBusInfo = useCallback(() => {
    setBusInfo(null);
  }, []);

  const contextValue = useMemo(() => ({
    showBusInfo,
    hideBusInfo
  }), [showBusInfo, hideBusInfo]);
  
  return (
    <BusPopupContext.Provider value={contextValue}>
      {children}
      {busInfo && (
        <BusRoutePopup
          route={busInfo.route}
          stops={busInfo.stops}
          currentStop={busInfo.currentStop}
          destination={busInfo.destination}
          userLocation={busInfo.userLocation}
          onClose={hideBusInfo}
          tileStopName={busInfo.tileStopName}
          stopsAway={busInfo.stopsAway}
          vehicleRef={busInfo.vehicleRef} // Ensure this is passed
        />
      )}
    </BusPopupContext.Provider>
  );
};

export const useBusPopup = () => {
  const context = useContext(BusPopupContext);
  if (!context) {
    throw new Error('useBusPopup must be used within a BusPopupProvider');
  }
  return context;
};