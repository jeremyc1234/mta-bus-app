import React from "react";
import { Inter } from "next/font/google";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MTA Bus Finder",
  description:
    "Find New York City MTA bus route location and arrival information.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MLQ6ZJX7');
            `,
          }}
        />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body 
        className={inter.className} 
        style={{ 
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowX: "hidden",
          width: "100%"
        }}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MLQ6ZJX7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        <Header />
        <main style={{ 
          flex: 1, 
          position: "relative",
          width: "100%",
          overflowX: "hidden"
        }}>
          {children}
        </main>
        <footer
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#f1f1f1",
            fontSize: "0.9rem",
            width: "100%",
            marginTop: "auto",
            zIndex: "1100",
          }}
        >
          Made with ❤️ using Next.js and MTA API
        </footer>
      </body>
    </html>
  );
}
