import React from "react";
import { Inter } from "next/font/google";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MTA Bus Finder",
  description:
    "Find New York City MTA bus route location and arrival information. Either use your location, select from a list of NYC tourist attractions and locations, or type in an address to find the nearest bus routes and information.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
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