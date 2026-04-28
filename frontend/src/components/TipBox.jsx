import React from 'react';
import { Lightbulb } from 'lucide-react';

/**
 * Reusable premium TipBox component.
 * Shows a glowing amber tip with a pulsing border animation.
 */
export default function TipBox({ tip, label = 'Tip' }) {
  if (!tip) return null;

  return (
    <div style={{
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Glow layer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.12) 100%)',
        borderRadius: 16,
        pointerEvents: 'none',
      }} />

      {/* Main box */}
      <div style={{
        position: 'relative',
        border: '1.5px solid rgba(251,191,36,0.6)',
        borderRadius: 16,
        padding: '13px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 0 0 3px rgba(251,191,36,0.08), 0 4px 20px rgba(245,158,11,0.18)',
      }}>

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(251,191,36,0.2)',
            border: '1.5px solid rgba(251,191,36,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: 'tip-pulse 2.5s ease-in-out infinite',
          }}>
            <Lightbulb size={13} color="#fbbf24" />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 900,
            color: '#fbbf24',
            textTransform: 'uppercase', letterSpacing: '0.18em',
          }}>
            {label}
          </span>
        </div>

        {/* Tip text */}
        <p style={{
          margin: 0,
          fontSize: 13, fontWeight: 700,
          color: '#fef9c3',
          lineHeight: 1.65,
          paddingLeft: 33,
        }}>
          {tip}
        </p>
      </div>

      <style>{`
        @keyframes tip-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.35); }
          50%       { box-shadow: 0 0 0 5px rgba(251,191,36,0); }
        }
      `}</style>
    </div>
  );
}
