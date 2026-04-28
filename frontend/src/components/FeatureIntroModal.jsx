import React, { useState } from 'react';

const INTRO_KEY = (featureKey) => `handspeak_intro_seen_${featureKey}`;

export function isIntroSeen(featureKey) {
  try { return localStorage.getItem(INTRO_KEY(featureKey)) === 'true'; } catch { return false; }
}

export function markIntroSeen(featureKey) {
  try { localStorage.setItem(INTRO_KEY(featureKey), 'true'); } catch {}
}

export default function FeatureIntroModal({ featureKey, title, subtitle, Icon, accentColor = '#67e8f9', steps, onDismiss }) {
  const [visible] = useState(() => !isIntroSeen(featureKey));

  if (!visible) return null;

  const handleDismiss = () => {
    markIntroSeen(featureKey);
    onDismiss?.();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,8,28,0.92)', backdropFilter: 'blur(16px)',
      padding: 20, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)',
        border: `1px solid ${accentColor}38`,
        borderRadius: 28, width: '100%', maxWidth: 480,
        boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px ${accentColor}12`,
        overflow: 'hidden',
        animation: 'fi-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Icon header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '28px 24px 20px',
          background: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 70%)`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `${accentColor}20`,
            border: `1.5px solid ${accentColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: `0 8px 32px ${accentColor}25`,
          }}>
            {Icon && <Icon size={28} color={accentColor} strokeWidth={2.2} />}
          </div>
          <div style={{ fontSize: 10, fontWeight: 900, color: accentColor, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Feature Guide
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.1, textAlign: 'center' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 6, textAlign: 'center' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Steps */}
        {steps?.length > 0 && (
          <div style={{ padding: '18px 24px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '11px 14px',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.Icon
                    ? <step.Icon size={14} color={accentColor} strokeWidth={2.5} />
                    : <span style={{ fontSize: 11, fontWeight: 900, color: accentColor }}>{i + 1}</span>
                  }
                </div>
                <div>
                  {step.label && (
                    <div style={{ fontSize: 10, fontWeight: 900, color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>
                      {step.label}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 700, lineHeight: 1.45 }}>
                    {step.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ padding: '16px 24px 24px' }}>
          <button
            onClick={handleDismiss}
            style={{
              width: '100%', padding: '14px', borderRadius: 16, border: 'none',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              color: '#020a1c', fontWeight: 900, fontSize: 14,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              boxShadow: `0 6px 24px ${accentColor}40`,
              letterSpacing: '0.04em',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 10px 32px ${accentColor}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 6px 24px ${accentColor}40`;
            }}
          >
            Got it, let's go!
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fi-pop {
          from { transform: scale(0.88) translateY(24px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
