// app/providers.tsx
"use client";

import React from 'react';
import { LocationProvider } from './locationContext';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GTM_ID = 'GTM-MLQ6ZJX7';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'pageview',
        page_path: pathname,
      });
    }
  }, [pathname]);

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      <LocationProvider>
        {children}
      </LocationProvider>
    </>
  );
}