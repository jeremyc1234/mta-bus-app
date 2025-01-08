// app/layout.tsx
import { Inter } from 'next/font/google';
import Header from './header';
import Link from 'next/link';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });
const GTM_ID = 'GTM-MLQ6ZJX7';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9527056951697290"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className} style={{ overflowX: 'hidden' }}>
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
              position: 'relative',
              width: '100%',
              minHeight: 'auto',
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
              marginTop: 'auto',
              zIndex: '1100',
              overflowX: 'hidden',
            }}
          >
            <nav style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '10px'
            }}>
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