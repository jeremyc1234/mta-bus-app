'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import Header from './header';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });
const GTM_ID = 'GTM-MLQ6ZJX7';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
   <html lang="en">
     <head>
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
     </head>
     <body className={inter.className} style={{ overflowX: 'hidden' }}>
       <noscript>
         <iframe
           src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
           height="0"
           width="0"
           style={{ display: 'none', visibility: 'hidden' }}
         ></iframe>
       </noscript>

       <Header />
       <main
  style={{
    flex: 1,
    position: 'relative',
    width: '100%',
    minHeight: 'auto', // Remove static minHeight
    overflowY: 'auto',
    overflowX: 'hidden',
    touchAction: 'pan-y',
    boxSizing: 'border-box',
  }}
>
         {children}
       </main>
       <footer
  style={{
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f1f1f1',
    fontSize: '0.9rem',
    width: '100%',
    maxWidth: '100vw',
    boxSizing: 'border-box',
    marginTop: 'auto',
    zIndex: '1100',
    overflowX: 'hidden'
  }}
>
  Made with ❤️ using Next.js and MTA API
</footer>
     </body>
   </html>
 );
}