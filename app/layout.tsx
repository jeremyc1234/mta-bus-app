import { Inter } from 'next/font/google';
import Header from './header';
import Link from 'next/link';
import { Providers } from './providers';
import Script from 'next/script';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });
const GTM_ID = 'GTM-MLQ6ZJX7';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0 }}>
      <Head>
        <title>NYC Bus Schedules | MTA Bus Finder</title>
        <meta name="description" content="Find real-time New York City bus schedules, stop locations, and arrival times. Get accurate MTA bus tracking information for all NYC boroughs." />
        <meta property="og:title" content="NYC Bus Schedules | MTA Bus Finder" />
        <meta property="og:description" content="Find real-time New York City bus schedules, stop locations, and arrival times. Get accurate MTA bus tracking information for all NYC boroughs." />
        <style>
          {`
            html, body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              overflow-x: hidden;
              box-sizing: border-box;
              width: 100%;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
            }

            #__next {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
              width: 100%;
            }
          `}
        </style>
        <Script 
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('DOMContentLoaded', (event) => {
                window.onload = function() {
                  setTimeout(function() {
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=XXXXXXXXXXXXX&gtm_preview=env-2&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${GTM_ID}');
                  }, 5000);
                };
              });
            `
          }}
        />
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9527056951697290"
          crossOrigin="anonymous"
        />
      </Head>
      <body
        className={inter.className}
        style={{
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <Providers>
          <Header />
          <main
            style={{
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box',
              margin: 0,
              padding: 0,
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
              marginTop: 'auto',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            }}
          >
            <nav
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '10px',
              }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  color: 'grey',
                }}
              >
                Home
              </Link>
              <Link
                href="/schedules"
                style={{
                  textDecoration: 'none',
                  color: 'grey',
                }}
              >
                Schedules
              </Link>
              <Link
                href="/about"
                style={{
                  textDecoration: 'none',
                  color: 'grey',
                }}
              >
                About
              </Link>
            </nav>
            Made with ❤️ using Next.js and MTA API
          </footer>
        </Providers>
      </body>
    </html>
  );
}