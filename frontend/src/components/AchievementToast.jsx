import React, { useEffect, useState } from 'react';

export function showAchievements(newAchievements) {
  if (!newAchievements?.length) return;
  // Stagger multiple achievements 600ms apart
  newAchievements.forEach((a, i) => {
    setTimeout(() => {
      const event = new CustomEvent('handspeak:achievement', { detail: a });
      window.dispatchEvent(event);
    }, i * 700);
  });
}

export default function AchievementToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const achievement = e.detail;
      const id = `${achievement.id}-${Date.now()}`;
      setToasts(prev => [...prev, { ...achievement, toastId: id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== id));
      }, 4000);
    };
    window.addEventListener('handspeak:achievement', handler);
    return () => window.removeEventListener('handspeak:achievement', handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => <AchievementToast key={t.toastId} achievement={t} />)}
    </div>
  );
}

function AchievementToast({ achievement }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
      border: '1.5px solid rgba(129,140,248,0.55)',
      borderRadius: 18,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(129,140,248,0.12)',
      fontFamily: "'Nunito', sans-serif",
      minWidth: 280, maxWidth: 340,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      pointerEvents: 'auto',
    }}>
      {/* Icon badge */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'rgba(129,140,248,0.2)',
        border: '1.5px solid rgba(129,140,248,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        boxShadow: '0 4px 16px rgba(129,140,248,0.3)',
      }}>
        {achievement.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 9, fontWeight: 900, color: '#a5b4fc',
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3,
        }}>
          Achievement Unlocked
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>
          {achievement.desc}
        </div>
        {achievement.xp_bonus > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5,
            background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 99, padding: '2px 8px',
            fontSize: 10, fontWeight: 900, color: '#fde68a',
          }}>
            +{achievement.xp_bonus} XP
          </div>
        )}
      </div>
    </div>
  );
}
