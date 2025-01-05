import React, { useState, useEffect } from 'react';

interface ServiceAlert {
  route: string;
  summary: string;
  description: string;
  creationTime: string;
  updatedTime: string;
  activePeriod: Array<{ start: string; end: string }>;
  status: string;
  notice: string;
  mapLink?: string;
}

interface ServiceAlertPopupProps {
  alert: ServiceAlert;
  onClose: () => void;
}

const ServiceAlertPopup: React.FC<ServiceAlertPopupProps> = ({ alert, onClose }) => {
  const [formattedUpdatedTime, setFormattedUpdatedTime] = useState<string>("");

  useEffect(() => {
    if (alert?.updatedTime) {
      const updatedDate = new Date(alert.updatedTime);
      
      if (isNaN(updatedDate.getTime())) {
        setFormattedUpdatedTime(alert.updatedTime);
      } else {
        const formattedTime = updatedDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
        });
        setFormattedUpdatedTime(formattedTime);
      }
    }
  }, [alert?.updatedTime]);

  const formatDescription = (description: string) => {
    // First, normalize any existing newlines to single spaces
    let formattedText = description.replace(/\n/g, ' ');
    
    // Split the text at our special phrases and create an array
    const segments = formattedText.split(/(What's happening\?|Note:)/gi);
    
    // Process each segment
    return segments.map((segment, index) => {
      if (segment.toLowerCase() === "what's happening?") {
        return `\n\n🙋 ${segment}`;
      } else if (segment === "Note:") {
        return `\n\n📕 ${segment}`;
      }
      return segment;
    }).join('').replace(/See a map/gi, '').trim();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2500,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          margin: '20px',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '8px 12px',
            zIndex: 1,
          }}
          aria-label="Close alert"
        >
          ×
        </button>

        <h2 style={{ 
          textAlign: 'center',
          marginBottom: '15px',
          fontSize: '1.25rem',
          paddingRight: '30px'
        }}>
          🚨 Service Status for Route {alert.route}
        </h2>
        <p style={{ 
          marginBottom: '15px', 
          color: 'red', 
          fontStyle: 'italic',
          padding: '10px',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}>
          Note: Real-time tracking may be inaccurate in the service change area
        </p>
        <p style={{ marginBottom: '15px' }}>
          <strong>📝 Summary:</strong> {alert.summary}
        </p>
        
        <p style={{ 
          marginBottom: '15px',
          whiteSpace: 'pre-line' // This enables the newlines to be rendered
        }}>
          <strong>📄 Description:</strong> {formatDescription(alert.description).split('\n').map((part, index) => {
            if (part.includes("What's happening?")) {
              const [emoji, ...rest] = part.split("What's happening?");
              return (
                <span key={index}>
                  {emoji}<strong>What's happening?</strong>{rest}
                </span>
              );
            } else if (part.includes("Note:")) {
              const [emoji, ...rest] = part.split("Note:");
              return (
                <span key={index}>
                  {emoji}<strong>Note:</strong>{rest}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          }).map((element, i) => (
            <React.Fragment key={i}>
              {element}
              {i !== formatDescription(alert.description).split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>

        {alert.notice && (
          <p style={{ 
            marginBottom: '15px', 
            color: 'red', 
            fontStyle: 'italic',
            padding: '10px',
            backgroundColor: '#fff5f5',
            borderRadius: '8px'
          }}>
            {alert.notice}
          </p>
        )}
        
        <p style={{ marginBottom: '15px' }}>
          <strong>🕒 Last Updated:</strong> {formattedUpdatedTime || 'No last updated time provided'}
        </p>

        {alert.mapLink && alert.mapLink.toLowerCase().endsWith('.png') && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <img
                src={alert.mapLink}
                alt="Map Preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                }}
                loading="lazy"
              />
            </div>
            <p style={{ marginTop: '15px' }}>
              <a
                href={alert.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#2360A5',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  backgroundColor: '#f0f7ff',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}
              >
                View Full Map 🔗
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceAlertPopup;