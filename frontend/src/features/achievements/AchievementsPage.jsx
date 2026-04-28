import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { getAchievements } from '../../lib/rewards';

const CATEGORY_LABELS = {
  milestone: 'First Steps',
  quiz:      'Sign Quiz',
  match:     'Sign Match',
  streak:    'Streaks',
  xp:        'XP Milestones',
  level:     'Level Milestones',
};

const CATEGORY_ORDER = ['milestone', 'quiz', 'match', 'streak', 'xp', 'level'];

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements().then(data => {
      setAchievements(data || []);
    }).finally(() => setLoading(false));
  }, []);

  const earned = achievements.filter(a => a.earned).length;
  const total  = achievements.length;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = achievements.filter(a => a.category === cat);
    return acc;
  }, {});

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% -10%, #1e1b4b 0%, #0f0e1a 50%, #020a1c 100%)',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
        background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} color="white" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={16} color="#fbbf24" />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Achievements</span>
        </div>
        <div style={{ flex: 1 }} />
        {!loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 99, padding: '4px 12px',
          }}>
            <Trophy size={12} color="#fbbf24" />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#fde68a' }}>{earned} / {total}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #fbbf24', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '24px 20px 48px', maxWidth: 720, width: '100%', margin: '0 auto' }}>

          {/* Overall progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Overall Progress</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{total ? Math.round((earned / total) * 100) : 0}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${total ? (earned / total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Categories */}
          {CATEGORY_ORDER.map(cat => {
            const items = grouped[cat] || [];
            if (!items.length) return null;
            const catEarned = items.filter(a => a.earned).length;
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>
                    {catEarned}/{items.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {items.map(a => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }) {
  const earned = achievement.earned;
  return (
    <div style={{
      background: earned
        ? 'linear-gradient(135deg, rgba(129,140,248,0.18), rgba(99,102,241,0.12))'
        : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${earned ? 'rgba(129,140,248,0.45)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 18,
      padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      transition: 'border-color 0.2s ease',
      opacity: earned ? 1 : 0.55,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: earned ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${earned ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: earned ? 22 : 18,
      }}>
        {earned ? achievement.icon : <Lock size={16} color="rgba(255,255,255,0.25)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: earned ? 'white' : 'rgba(255,255,255,0.45)', lineHeight: 1.2, marginBottom: 3 }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, lineHeight: 1.4 }}>
          {achievement.desc}
        </div>
        {earned && achievement.xp_bonus > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', marginTop: 5,
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 99, padding: '2px 7px',
            fontSize: 10, fontWeight: 900, color: '#fde68a',
          }}>
            +{achievement.xp_bonus} XP
          </div>
        )}
      </div>
    </div>
  );
}
