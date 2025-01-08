import React, { useRef, useState, useCallback, useEffect } from 'react';

interface ScrollableTileProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const ScrollableTile: React.FC<ScrollableTileProps> = ({ children, style }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [scrollAtTop, setScrollAtTop] = useState(true);
  const [scrollAtBottom, setScrollAtBottom] = useState(true);

  const handleScroll = useCallback(() => {
    if (!tileRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = tileRef.current;

    // If content is smaller than container, it’s both at top & bottom
    if (scrollHeight <= clientHeight) {
      setScrollAtTop(true);
      setScrollAtBottom(true);
    } else {
      setScrollAtTop(scrollTop <= 0);
      setScrollAtBottom(scrollTop + clientHeight >= scrollHeight);
    }
  }, []);

  // Make sure we check scroll on mount/update too
  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden', // so top/bottom gradients appear “on top”
        ...style,          // merge any style you pass in
      }}
    >
      {/* TOP GRADIENT SHADOW (only show if NOT at top) */}
      {!scrollAtTop && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '20px',
            pointerEvents: 'none',
            zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))',
          }}
        />
      )}

      {/* SCROLLABLE CONTENT */}
      <div
        ref={tileRef}
        onScroll={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          // You can add custom scrollbar styles here if you like
        }}
      >
        {children}
      </div>

      {/* BOTTOM GRADIENT SHADOW (only show if NOT at bottom) */}
      {!scrollAtBottom && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            pointerEvents: 'none',
            zIndex: 2,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))',
          }}
        />
      )}
    </div>
  );
};

export default ScrollableTile;
