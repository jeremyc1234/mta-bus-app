"use client";

import React, { useEffect, useState, useRef } from "react";

export default function About() {
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const contentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toggleFAQ = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    sessionStorage.setItem("visitedFromDiffPage", "true");

    return () => {
      if (!window.location.pathname.match(/^\/$/)) {
        sessionStorage.removeItem("visitedFromDiffPage");
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
        across the city&apos;s extensive network.
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
          <strong>⏰   Real-Time Tracking:</strong> Get live updates on bus locations and arrival times
        </li>
        <li
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>📍   Location Services:</strong> Find the nearest bus stops to your current location
        </li>
        <li
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>🗽   Popular Destinations:</strong> Easy access to bus information near NYC landmarks
        </li>
        <li
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>ℹ️   Route Information:</strong> View detailed route maps and stop sequences
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
          marginTop: "2rem",
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
              "Simply allow location access, select a predefined destination, or enter an address to see nearby bus stops and live bus tracking.",
          },
          {
            question: "Is the app free to use?",
            answer: "Yes, myNYCbus is completely free to use.",
          },
          {
            question: "How accurate is the tracking information?",
            answer:
              "We use the MTA Bus Time API, which generally provides accurate, real-time updates. However, there may be occasional inaccuracies. If something doesn't look right, please contact the MTA for details.",
          },
          {
            question: "Where can I find additional planned MTA schedule information?",
            answer: (
              <span>
                You may visit the{" "}
                <a
                  href="https://new.mta.info/schedules"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0078D7", textDecoration: "underline" }}
                >
                  MTA website
                </a>{" "}
                or reference our{" "}
                <a
                  href="/schedules"
                  style={{ color: "#0078D7", textDecoration: "underline" }}
                >
                  schedules page
                </a>
                .
              </span>
            ),
          },
          {
            question: "Is this website operated by the New York City MTA (Metropolitan Transportation Authority)?",
            answer: (
              <span>
                While we use MTA&apos;s Bus Time API, we are not directly affiliated with the MTA. If you would like to contact the MTA please go to the {" "}
                <a
                  href="https://new.mta.info/schedules"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0078D7", textDecoration: "underline" }}
                >
                  MTA website
                </a>
                .
              </span>
            ),
          },
        ].map((faq, index) => (
          <div
            key={index}
            style={{
              marginBottom: "1rem",
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
    backgroundColor: "#f5f5f5",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold",
    outline: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    textWrap: "wrap",
    wordBreak: "break-word",
  }}
>
              {faq.question}
              <span
            style={{
              transform: faqOpen[index] ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.3s ease",
            }}
          >
            🔽
          </span>
            </button>
            <div
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              style={{
                maxHeight: faqOpen[index]
                  ? `${contentRefs.current[index]?.scrollHeight || 0}px`
                  : "0px",
                overflow: "hidden",
                transition: "max-height 0.4s ease-in-out",
                backgroundColor: "#fff",

              }}
            >
              <div style={{ padding: "1rem" }}>{faq.answer}</div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "1.1rem",
          padding: "20px",
        }}
      >
        <p style={{ marginBottom: "10px" }}>
          <strong>What&apos;s on your mind? We'd love to hear your feedback!</strong>
        </p>
        <a
          href="/feedback"
          style={{
            textDecoration: "none",
            color: "#0078D7",
            fontWeight: "bold",
          }}
        >
          Share Your Feedback
        </a>
      </div>
      <div
      style={{
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#666",
        marginTop: "40px",
        padding: "10px 20px",
        borderTop: "1px solid #ddd",
      }}
    >
      <p>We are not affiliated with the MTA.</p>
    </div>

    </main>
    
  );
}
