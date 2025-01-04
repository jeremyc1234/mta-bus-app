"use client";

import React, { useEffect, useState } from "react";

export default function About() {
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const toggleFAQ = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    sessionStorage.setItem("visitedFromAbout", "true");

    return () => {
      if (!window.location.pathname.match(/^\/$/)) {
        sessionStorage.removeItem("visitedFromAbout");
      }
    };
  }, []);

  return (
    <main
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        flex: 1,
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        About Us
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          lineHeight: "1.6",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Welcome to MTA Bus Finder! This application helps you track New York City buses
        in real-time, providing up-to-date information about bus arrivals and departures
        across the city's extensive network.
      </p>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginTop: "2rem",
          marginBottom: "1rem",
        }}
      >
        Features
      </h2>
        
      <ul
        style={{
          marginBottom: "2rem",
          listStyleType: "none",
          padding: 0,
        }}
      >
        <li
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>Real-Time Tracking:</strong> Get live updates on bus locations and arrival times
        </li>
        <li
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>Location Services:</strong> Find the nearest bus stops to your current location
        </li>
        <li
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>Popular Destinations:</strong> Easy access to bus information near NYC landmarks
        </li>
        <li
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>Route Information:</strong> View detailed route maps and stop sequences
        </li>
      </ul>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        How It Works
      </h2>

      <p
        style={{
          fontSize: "1.1rem",
          lineHeight: "1.6",
          marginBottom: "1.5rem",
        }}
      >
        Our application uses the MTA Bus Time API to provide real-time information about
        bus locations and arrival times. Simply allow location access, select a
        destination, or type in an address to see nearby bus stops and upcoming arrivals.
      </p>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        FAQs
      </h2>

      <div>
        {[
          {
            question: "How do I track a bus?",
            answer:
              "Simply enter your bus route or allow location access to see nearby bus stops and live bus tracking.",
          },
          {
            question: "Is the app free to use?",
            answer: "Yes, MTA Bus Finder is completely free to use.",
          },
          {
            question: "How accurate is the tracking information?",
            answer:
              "We use the MTA Bus Time API, which provides real-time updates. However, occasional delays may occur.",
          },
        ].map((faq, index) => (
          <div
            key={index}
            style={{
              marginBottom: "1rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <button
  onClick={() => toggleFAQ(index)}
  style={{
    width: "100%",
    textAlign: "left",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold",
    outline: "none", // Remove default focus outline
  }}
>
  {faq.question}
  <span style={{ float: "right" }}>
    {faqOpen[index] ? "▲" : "▼"}
  </span>
</button>
            {faqOpen[index] && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderTop: "1px solid #ddd",
                }}
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
        <h2
  style={{
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  }}
>
  Quick Access to Bus Schedules from MTA
</h2>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "2rem",
  }}
>
  {[
    { name: "Bronx", link: "https://new.mta.info/schedules/bus/bronx" },
    { name: "Brooklyn", link: "https://new.mta.info/schedules/bus/Brooklyn" },
    { name: "Queens", link: "https://new.mta.info/schedules/bus/queens" },
    { name: "Manhattan", link: "https://new.mta.info/schedules/bus/manhattan" },
    { name: "Staten Island", link: "https://new.mta.info/schedules/bus/si" },
  ].map((borough, index) => (
    <a
      key={index}
      href={borough.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: "none",
        color: "#0078D7",
        fontWeight: "500",
        fontSize: "1.1rem",
        padding: "10px",
        backgroundColor: "#f1f1f1",
        borderRadius: "8px",
        textAlign: "center",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6e6e6")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f1f1f1")}
    >
      {borough.name} Bus Schedules
    </a>
  ))}
</div>
      </div>
    </main>
  );
}
