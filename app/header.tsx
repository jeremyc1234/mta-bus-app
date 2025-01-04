"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars } from "react-icons/fa";

const TABLET_BREAKPOINT = 768;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

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

        {/* Only render mobile menu button if window width is set and below breakpoint */}
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
            }}
            aria-label="Toggle menu"
          >
            <FaBars />
          </button>
        )}

        {/* Logo */}
<Link 
  href="/"
  style={{
    display: 'flex',
    alignItems: 'center',
    marginRight: 'auto', // This will push everything else to the right
    zIndex: 2002,
  }}
>
  <img
    src="/icons/logo.png"
    alt="Logo"
    style={{
      height: "60px",
      width: "auto",
      objectFit: "contain",
    }}
  />
</Link>

        {/* Desktop Navigation - only render if window width is set and above breakpoint */}
        {windowWidth > 0 && windowWidth > TABLET_BREAKPOINT && (
          <nav style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '2rem',
          }}>
            <Link 
              href="/"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.1rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
              }}
            >
              Home
            </Link>
            <Link 
              href="/about"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.1rem',
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
                href="/"
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
                href="/about"
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
    </header>
  );
}