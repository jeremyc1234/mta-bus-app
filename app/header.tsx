"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation";
import HeaderSection from "./headerSection";
import Image from "next/image";

const TABLET_BREAKPOINT = 768;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const pathname = usePathname();
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    // Only set window width after component mounts
    setWindowWidth(window.innerWidth);
  }, []);

  const handleLocationChange = async (newLocation: { lat: number | null; lon: number | null }) => {
    if (newLocation.lat && newLocation.lon) {
      setIsLocationChanging(true);
      try {
        setSelectedStop(`${newLocation.lat}, ${newLocation.lon}`);
      } catch (error) {
        console.error("Error during location change:", error);
      } finally {
        // Reset location changing state after a delay
        setTimeout(() => {
          setIsLocationChanging(false);
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > TABLET_BREAKPOINT) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  // Add animation styles after mounting
  useEffect(() => {
    if (!mounted) return;

    const style = document.createElement("style");
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
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, [mounted]);

  const handleHomeClick = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem("visitedFromHeader", "true");
    }
    return false;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    // <Suspense fallback={<div>Loading Header...</div>}>
      <header
        style={{
          width: "100%",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 2000,
          minHeight: "80px",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            height: "80px",
          }}
        >
          {windowWidth > 0 && windowWidth <= TABLET_BREAKPOINT && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                zIndex: 2004,
                display: "flex",
                alignItems: "center",
                padding: "8px",
                position: "absolute",
                left: "20px",
              }}
              aria-label="Toggle menu"
            >
              <FaBars />
            </button>
          )}

          <Link
            href="/"
            onClick={handleHomeClick}
            style={{
              display: "flex",
              alignItems: "center",
              zIndex: 1999,
              ...(windowWidth <= TABLET_BREAKPOINT
                ? {
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    margin: "0",
                  }
                : {
                    marginRight: "auto",
                    marginLeft: "20px",
                  }),
            }}
          >
            <Image
              src="/icons/logo.png"
              alt="Logo"
              width={140}
              height={60}
              priority
              style={{
                objectFit: "contain",
              }}
            />
          </Link>

          {windowWidth > TABLET_BREAKPOINT && (
            <nav
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "0.25rem",
              }}
            >
              <Link
                href="/"
                onClick={() => {
                  setIsMenuOpen(false);
                  sessionStorage.setItem("visitedFromHamburger", "true");
                }}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: "1.3rem",
                  fontWeight: "500",
                  padding: "0.5rem 1rem",
                }}
              >
                Home
              </Link>
              <Link
                href="/schedules"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: "1.3rem",
                  fontWeight: "500",
                  padding: "0.5rem 1rem",
                }}
              >
                Schedules
              </Link>
              <Link
                href="/about"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: "1.3rem",
                  fontWeight: "500",
                  padding: "0.5rem 1rem",
                }}
              >
                About
              </Link>
            </nav>
          )}

          {windowWidth > 0 && windowWidth <= TABLET_BREAKPOINT && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 1998,
                  opacity: isMenuOpen ? 1 : 0,
                  visibility: isMenuOpen ? "visible" : "hidden",
                  transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
                }}
                onClick={() => setIsMenuOpen(false)}
              />
              <nav
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: "250px",
                  backgroundColor: "#fff",
                  boxShadow: "2px 0 4px rgba(0, 0, 0, 0.1)",
                  padding: "80px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  zIndex: 2001,
                  transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)",
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <Link
                  href="/"
                  onClick={() => {
                    setIsMenuOpen(false);
                    sessionStorage.setItem("visitedFromHamburger", "true");
                  }}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                    textDecoration: "none",
                    color: "inherit",
                    fontSize: "1.1rem",
                  }}
                >
                  Home
                </Link>
                <Link
                  href="/schedules"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                    textDecoration: "none",
                    color: "inherit",
                    fontSize: "1.1rem",
                  }}
                >
                  Schedules
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                    textDecoration: "none",
                    color: "inherit",
                    fontSize: "1.1rem",
                  }}
                >
                  About
                </Link>
              </nav>
            </>
          )}
        </div>

        {pathname === "/" && (
          <div style={{ borderTop: "1px solid #e0e0e0" }}>
            {/* <Suspense fallback={<div>Loading Header Section...</div>}> */}
              <HeaderSection
                selectedStop={selectedStop}
                onLocationChange={handleLocationChange}
                windowWidth={windowWidth}
                isLocationChanging={isLocationChanging}
                setIsLocationChanging={setIsLocationChanging}
              />
            {/* </Suspense> */}
          </div>
        )}
      </header>
    // </Suspense>
  );
}