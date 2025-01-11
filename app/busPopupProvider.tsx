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
  vehicleRef?: string;
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
  vehicleRef?: string;
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
    vehicleRef?: string
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
}: BusRoutePopupProps) => {
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
    const stopsToUse = [...stops];
    return stopsToUse;
  }, [stops]);

  // Calculate stops between user stop and top of list
  const stopsToTop = useMemo(() => {
    const userStopIndex = adjustedStops.findIndex(stop => stop === tileStopName);
    return userStopIndex;
  }, [adjustedStops, tileStopName]);

  // Determine if bus is beyond visible stops
  const isBusBeyondStops = useMemo(() => {
    return stopsAway > stopsToTop;
  }, [stopsAway, stopsToTop]);

  // Calculate stops beyond the top if applicable
  const stopsBeyondTop = useMemo(() => {
    return isBusBeyondStops ? stopsAway - stopsToTop : 0;
  }, [isBusBeyondStops, stopsAway, stopsToTop]);

  const estimatedStopIndex = useMemo(() => {
    const closestStopIndex = adjustedStops.findIndex(stop => stop === tileStopName);
    if (closestStopIndex === -1 || stopsAway < 0) return -1;
    return Math.max(0, closestStopIndex - stopsAway);
  }, [adjustedStops, tileStopName, stopsAway]);

  const busPosition = useMemo(() => {
    if (isBusBeyondStops) return 0;
    
    const estimatedIndex = adjustedStops.findIndex((stop, index) => index === estimatedStopIndex);
    
    const busStopIndex = estimatedIndex !== -1 ? estimatedIndex : currentStop;
    
    return (busStopIndex / (adjustedStops.length - 1)) * 100;
  }, [adjustedStops, estimatedStopIndex, currentStop, isBusBeyondStops]);

  const handleScroll = useCallback((event: Event) => {
    const scrollEl = event.target as HTMLDivElement;
    if (!scrollEl?.children) return;
  
    const closestStopElement = Array.from(scrollEl.querySelectorAll('div[data-stop]'))
      .find(div => div.textContent?.includes('(Closest stop to you)'));
  
    if (closestStopElement) {
      const rect = closestStopElement.getBoundingClientRect();
      const containerRect = scrollEl.getBoundingClientRect();
      const isVisible = rect.top < containerRect.bottom - 100 && rect.bottom > containerRect.top + 100;
  
      if (isVisible) {
        setStopPosition('visible');
      } else if (rect.top <= containerRect.top + 100) {
        setStopPosition('above');
      } else {
        setStopPosition('below');
      }
    }
  }, []);

  useEffect(() => {
    const scrollEl = scrollableRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      // Trigger initial check
      handleScroll({ target: scrollEl } as unknown as Event);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const scrollEl = scrollableRef.current;
  
    if (scrollEl) {
      const closestStopElement = Array.from(scrollEl.querySelectorAll('div[data-stop]'))
        .find(div => div.textContent?.includes('(Closest stop to you)'));
  
      if (closestStopElement) {
        // Scroll to the closest stop smoothly
        closestStopElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [stops]);

  const [showDriveAnimation, setShowDriveAnimation] = useState(true);

  useEffect(() => {
    setShowDriveAnimation(true);
    requestAnimationFrame(() => setShowDriveAnimation(false));
  }, []);

  const stopsList = useMemo(() => (
    adjustedStops.map((stop: string, index: number) => {
      const isUserStop = stop === userLocation;
      const isCurrentStop = index === currentStop;
      const isTileStop = stop === tileStopName;
      const isEstimatedStop = index === estimatedStopIndex;
  
      let backgroundColor = 'transparent';
  
      if (isUserStop && isCurrentStop) {
        backgroundColor = '#e6f7ff';
      } else if (isUserStop) {
        backgroundColor = '#e6f7ff';
      } else if (isCurrentStop) {
        backgroundColor = '#FFEE93';
      } else if (isTileStop) {
        backgroundColor = '#e6f7ff';
      } else if (isEstimatedStop && !isBusBeyondStops) {
        backgroundColor = '#FFD700';
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
          {isEstimatedStop && !isBusBeyondStops && (
            <span style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
              (Our estimated bus location)
            </span>
          )}
        </div>
      );
    })
  ), [adjustedStops, userLocation, currentStop, tileStopName, estimatedStopIndex, isBusBeyondStops]);

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
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          flex: 'none',
          position: 'relative',
          zIndex: 2,  // Add this line
        }}>
          {stopPosition === 'above' && (
  <div style={{
    position: 'absolute',
    top: '80px',
    left: 0,
    right: 0,
    height: '40px',
    background: 'linear-gradient(to bottom, rgba(0, 120, 215, 0.2), transparent)',
    zIndex: 1,
    pointerEvents: 'none',
  }} />
)}

{stopPosition === 'below' && (
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40px',
    background: 'linear-gradient(to top, rgba(0, 120, 215, 0.2), transparent)',
    zIndex: 1,
    pointerEvents: 'none',
  }} />
)}
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

          {isBusBeyondStops && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '16px',
              backgroundColor: '#EBF5FF',
              padding: '12px',
              borderRadius: '8px',
            }}>
              <Image
                src="/icons/bus_icon.png"
                alt="Bus"
                width={110}
                height={30}
                style={{ marginRight: '12px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#1E40AF' }}>
                +{stopsBeyondTop} {stopsBeyondTop === 1 ? 'Stop' : 'Stops'} Away
              </span>
            </div>
          )}
        </div>

        <div
      ref={scrollableRef}
      style={{
        flex: '1',
        overflowY: 'auto',
        padding: '20px',
        minHeight: 0,
        position: 'relative', // Add this line
      }}
    >
          <div style={{ display: 'flex', gap: '20px', height: 'auto', minHeight: '100%' }}>
            {!isBusBeyondStops && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                marginLeft: '5px',
                marginRight: '10px',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: showDriveAnimation ? '0%' : `${busPosition}%`,
                  width: '40px',
                  height: '150px',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  left: '0px',
                  transition: 'top 1s ease-in-out',
                }}>
                  <style>{RainbowAnimation}</style>
                  <div style={{
                    width: '20px',
                    height: '405px',
                    top: '-400px',
                    left: '0px',
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
            )}

            <div style={{
              width: '2px',
              backgroundColor: '#0078D7',
              position: 'relative',
              minHeight: '100%',
              height: 'auto',
              zIndex: 0,
              marginRight: '5px'
            }} />

            <div style={{ flex: 1 }}>
              {stopsList}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BusRoutePopup.displayName = 'BusRoutePopup';

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
    vehicleRef?: string
  ) => {
    showBusInfo({
      route,
      stops,
      currentStop,
      destination,
      userLocation,
      tileStopName,
      stopsAway,
      vehicleRef
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
          vehicleRef={busInfo.vehicleRef}
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

