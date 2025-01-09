import React from 'react';

interface IssueBannerProps {
  isVisible: boolean;
  onClose: () => void;
}

const IssueBanner: React.FC<IssueBannerProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      style={{
        width: '100%',
        overflow: 'hidden',
        transition: 'all 300ms ease-in-out',
        maxHeight: isVisible ? '500px' : '0',
        opacity: isVisible ? 1 : 0,
        backgroundColor: '#FEF2F2',
        borderBottom: '1px solid #FCA5A5'
      }}
    >
      <div style={{
        margin: '1rem',
        position: 'relative',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#DC2626'
        }}>
            <p className="issue-text" style={{ margin: '4px 24px' }}>
      There is a known issue where the MTA Bus Time API occasionally sends stops in the wrong direction, causing the stops list to be incorrect in the popup. Please use this data with caution and reference the 
      <a 
        href="https://bustime.mta.info/" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: "red", textDecoration: "underline", marginLeft: "4px" }}
      >
        MTA website
      </a> if needed.
    </p>
        </h3>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            padding: '0.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: '#6B7280',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default IssueBanner;