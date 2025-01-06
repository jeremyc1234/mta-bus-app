"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation"; // Import usePathname
import HeaderSection from './headerSection';
import Image from 'next/image';

const TABLET_BREAKPOINT = 768;


export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const pathname = usePathname();
  const [isLocationChanging, setIsLocationChanging] = useState(false);

  const preserveUrlParams = (currentPath: string) => {
    if (typeof window === 'undefined') {
      // During server-side rendering, just return the path
      return currentPath;
    }
    
    const url = new URL(window.location.href);
    const searchParams = url.searchParams.toString();
    
    // If we have search params, append them, otherwise return just the path
    return searchParams ? `${currentPath}?${searchParams}` : currentPath;
  };

  const handleLocationChange = async (newLocation: { lat: number | null; lon: number | null }) => {
    if (newLocation.lat && newLocation.lon) {
      console.log("🚀 handleLocationChange triggered in Header");
      setIsLocationChanging(true); // Start loading animation
      console.log("⏳ isLocationChanging set to TRUE in Header");
      
      // Add a small delay to ensure the loading state is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        console.log("📌 Setting new location:", newLocation);
        setSelectedStop(`${newLocation.lat}, ${newLocation.lon}`);
      } catch (error) {
        console.error('❌ Error during location change:', error);
      }
    }
  };
  useEffect(() => {
    // Set initial window width after component mounts
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > TABLET_BREAKPOINT) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  

  // Add keyframe animations using useEffect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOut {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleHomeClick = () => {
    sessionStorage.setItem("visitedFromHeader", "true");
    // Return false to prevent the default navigation
    return false;
  };

  return (
    <header
      style={{
        width: "100%",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        position: "sticky",
        top: 0,
        zIndex: 2000,
        minHeight: "80px",
        overflowX: "hidden"
      }}
    >
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        height: "80px",
      }}>
        {/* Mobile menu button */}
        {windowWidth > 0 && windowWidth <= TABLET_BREAKPOINT && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              zIndex: 2001,
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              position: 'absolute',
              left: '20px',
            }}
            aria-label="Toggle menu"
          >
            <FaBars />
          </button>
        )}

        {/* Logo with conditional styling */}
        <Link 
          href={preserveUrlParams('/')}
          onClick={() => {
            handleHomeClick();
            // Don't prevent default - let the preserveUrlParams work
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            zIndex: 2002,
            ...(windowWidth <= TABLET_BREAKPOINT
              ? {
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  margin: '0',
                }
              : {
                  marginRight: 'auto',
                  marginLeft: '20px',
                })
          }}
        >
          <Image
            src="/icons/logo.png"
            alt="Logo"
            width={180} // Set appropriate width
            height={60} // Set appropriate height
            priority // Ensures the logo is preloaded for better performance
            style={{
              objectFit: "contain",
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        {windowWidth > 0 && windowWidth > TABLET_BREAKPOINT && (
          <nav style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '2rem',
          }}>
            <Link 
              href={pathname === '/' ? '/' : preserveUrlParams('/')}
              onClick={handleHomeClick}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.3rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
              }}
            >
              Home
            </Link>
            <Link 
              href={pathname === '/schedules' ? '/schedules' : preserveUrlParams('/schedules')}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.3rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
              }}
            >
              Schedules
            </Link>
            <Link 
              href={pathname === '/about' ? '/about' : preserveUrlParams('/about')}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.3rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
              }}
            >
              About
            </Link>
          </nav>
        )}

        {/* Mobile Menu */}
        {windowWidth > 0 && windowWidth <= TABLET_BREAKPOINT && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1998,
                opacity: isMenuOpen ? 1 : 0,
                visibility: isMenuOpen ? 'visible' : 'hidden',
                transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
              }}
              onClick={() => setIsMenuOpen(false)}
            />
            <nav style={{
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100%',
  width: '250px',
  backgroundColor: '#fff',
  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
  padding: '80px 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  zIndex: 1999,
  transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
  transition: 'transform 0.3s ease-in-out',
}}>
  <Link 
  href={pathname === '/' ? '/' : preserveUrlParams('/')}
  onClick={() => setIsMenuOpen(false)}
  style={{
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    textDecoration: 'none',
    color: 'inherit',
    fontSize: '1.1rem',
  }}
>
  Home
</Link>
<Link 
  href={pathname === '/schedules' ? '/schedules' : preserveUrlParams('/schedules')}
  onClick={() => setIsMenuOpen(false)}
  style={{
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    textDecoration: 'none',
    color: 'inherit',
    fontSize: '1.1rem',
  }}
>
  Schedules
</Link>
<Link 
  href={pathname === '/about' ? '/about' : preserveUrlParams('/about')}
  onClick={() => setIsMenuOpen(false)}
  style={{
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    textDecoration: 'none',
    color: 'inherit',
    fontSize: '1.1rem',
  }}
>
  About
</Link>
</nav>
          </>
        )}
      </div>
      {/* ✅ Show HeaderSection Only on Home Page */}
      {pathname === '/' && (
      <div style={{ borderTop: "1px solid #e0e0e0", }}>
        <HeaderSection
          selectedStop={selectedStop}
          onLocationChange={handleLocationChange}
          windowWidth={windowWidth}
          isLocationChanging={isLocationChanging} // Ensure this is passed
          setIsLocationChanging={setIsLocationChanging} // Ensure this is passed
        />
      </div>
    )}
    </header>
    
  );
}