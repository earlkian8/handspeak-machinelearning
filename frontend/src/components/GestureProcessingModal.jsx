import React from 'react';
import { CheckCircle2, XCircle, Loader2, Stars } from 'lucide-react';

const CHECKING_MESSAGES = [
  'Hold on...',
  'Looking closely...',
  'Almost done...',
];

export default function GestureProcessingModal({ open, phase = 'waiting', message = '', onClose }) {
  if (!open) return null;

  const isSuccess = phase === 'success';
  const isError   = phase === 'error';
  const isChecking = !isSuccess && !isError;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90,
      background: 'rgba(2,10,28,0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: isSuccess
          ? 'linear-gradient(160deg,#052e1a 0%,#083a22 100%)'
          : isError
            ? 'linear-gradient(160deg,#2a0a0a 0%,#380c0c 100%)'
            : 'linear-gradient(160deg,#0c1f3d 0%,#091530 100%)',
        border: `1.5px solid ${isSuccess ? 'rgba(52,211,153,0.35)' : isError ? 'rgba(239,68,68,0.35)' : 'rgba(103,232,249,0.2)'}`,
        borderRadius: 24,
        boxShadow: isSuccess
          ? '0 20px 60px rgba(52,211,153,0.25)'
          : isError
            ? '0 20px 60px rgba(239,68,68,0.2)'
            : '0 20px 60px rgba(0,0,0,0.5)',
        padding: '32px 28px 28px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
        animation: 'gpm-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: isSuccess
            ? 'linear-gradient(135deg,#34d399,#22d3ee)'
            : isError
              ? 'linear-gradient(135deg,#ef4444,#f97316)'
              : 'rgba(103,232,249,0.12)',
          border: `3px solid ${isSuccess ? 'rgba(52,211,153,0.5)' : isError ? 'rgba(239,68,68,0.5)' : 'rgba(103,232,249,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isSuccess
            ? '0 0 28px rgba(52,211,153,0.45)'
            : isError
              ? '0 0 28px rgba(239,68,68,0.35)'
              : 'none',
          animation: isChecking ? 'gpm-pulse 1.2s ease-in-out infinite' : 'gpm-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {isSuccess
            ? <CheckCircle2 size={38} color="white" />
            : isError
              ? <XCircle size={38} color="white" />
              : <Loader2 size={36} color="#67e8f9" style={{ animation: 'spin 0.9s linear infinite' }} />
          }
        </div>

        {/* Heading */}
        <div>
          <div style={{
            fontSize: isSuccess || isError ? 26 : 20,
            fontWeight: 900,
            lineHeight: 1.2,
            color: isSuccess ? '#6ee7b7' : isError ? '#fca5a5' : '#e2f8ff',
            marginBottom: 6,
          }}>
            {isSuccess ? 'Great job!' : isError ? 'Try again!' : 'Checking...'}
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: isSuccess
              ? 'rgba(167,243,208,0.85)'
              : isError
                ? 'rgba(254,202,202,0.85)'
                : 'rgba(224,242,254,0.7)',
            lineHeight: 1.5,
          }}>
            {isSuccess
              ? 'You did the sign correctly!'
              : isError
                ? (message && message.toLowerCase().includes('almost')
                    ? 'Keep practicing, you are almost there!'
                    : 'That did not quite match. Give it another go!')
                : 'Looking at your sign right now...'}
          </div>
        </div>

        {/* Subtle animated dots for checking state */}
        {isChecking && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#67e8f9',
                animation: `gpm-dot 1.1s ease-in-out ${i * 0.22}s infinite`,
                opacity: 0.6,
              }} />
            ))}
          </div>
        )}

        {phase === 'error' && onClose && (
          <button
            onClick={onClose}
            style={{
              border: 'none', borderRadius: 14,
              padding: '11px 28px',
              cursor: 'pointer',
              background: 'rgba(254,202,202,0.15)',
              color: '#fecaca',
              fontWeight: 900, fontSize: 14,
              fontFamily: "'Nunito', sans-serif",
              marginTop: 4,
            }}
          >
            Close
          </button>
        )}
      </div>

      <style>{`
        @keyframes gpm-pop { 0%{transform:scale(0.75);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes gpm-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(103,232,249,0.25)} 50%{box-shadow:0 0 0 10px rgba(103,232,249,0.0)} }
        @keyframes gpm-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
