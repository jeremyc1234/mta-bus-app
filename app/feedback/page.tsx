"use client";

import React, { useState } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Feedback() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    rating: '5',
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({
    type: null,
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your feedback! Your response has been recorded.'
      });
      setFormData({
        name: '',
        email: '',
        category: 'general',
        rating: '5',
        feedback: ''
      });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Sorry, there was an error submitting your feedback. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <main className={inter.className} style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      flex: 1,
    }}>
      <h1 style={{
        fontSize: "2rem",
        fontWeight: "bold",
        marginBottom: "1.5rem",
        textAlign: "center"
      }}>
        Feedback
      </h1>

      <p style={{
        fontSize: "1.1rem",
        lineHeight: "1.6",
        marginBottom: "2rem",
        textAlign: "center",
      }}>
        We value your feedback! Please share your thoughts about the MTA Bus Finder app.
      </p>

      {submitStatus.type && (
        <div style={{
          padding: "1rem",
          marginBottom: "1.5rem",
          borderRadius: "8px",
          backgroundColor: submitStatus.type === 'success' ? '#e6ffe6' : '#ffe6e6',
          color: submitStatus.type === 'success' ? '#006600' : '#cc0000',
          textAlign: "center"
        }}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        backgroundColor: "#f5f5f5",
        padding: "2rem",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="name" style={{ fontWeight: "bold" }}>Name (optional)</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="email" style={{ fontWeight: "bold" }}>Email (optional)</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="category" style={{ fontWeight: "bold" }}>Feedback Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem",
              backgroundColor: "white"
            }}
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="ui">User Interface</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="rating" style={{ fontWeight: "bold" }}>Rating (1-5 stars)</label>
          <input
            type="range"
            id="rating"
            name="rating"
            min="1"
            max="5"
            value={formData.rating}
            onChange={handleChange}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: "1.5rem" }}>
            {'⭐'.repeat(Number(formData.rating))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="feedback" style={{ fontWeight: "bold" }}>Your Feedback</label>
          <textarea
            id="feedback"
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            required
            rows={5}
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem",
              resize: "vertical"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "1rem",
            backgroundColor: "#2360A5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      <div style={{
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#666",
        marginTop: "40px",
        padding: "10px 20px",
        borderTop: "1px solid #ddd",
      }}>
        <p>Your feedback helps us improve the MTA Bus Finder app.</p>
      </div>
    </main>
  );
}