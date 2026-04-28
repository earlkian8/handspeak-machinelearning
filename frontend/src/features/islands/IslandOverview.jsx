import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, MessageCircle, Lightbulb, Star, Lock, Trophy, Flame, Shield, ChevronRight, Zap } from 'lucide-react';
import {
  getIslandProgress,
  getStoredStudyProgress,
  loadStudyProgress,
  isIslandUnlocked,
} from '../study/studyVoyage';
import { useIslands } from '../../contexts/IslandsContext';

/* ── per-island theme palette ── */
const ISLAND_THEMES = {
  alphabet:    { grad: 'linear-gradient(135deg, #065f46, #047857, #10b981)', accent: '#34d399', particles: 'leaves' },
  greetings:   { grad: 'linear-gradient(135deg, #9a3412, #ea580c, #fdba74)', accent: '#fb923c', particles: 'stars' },
  'chapter-1': { grad: 'linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd)', accent: '#60a5fa', particles: 'clouds' },
  'chapter-2': { grad: 'linear-gradient(135deg, #581c87, #7c3aed, #c084fc)', accent: '#a78bfa', particles: 'orbs' },
  'chapter-3': { grad: 'linear-gradient(135deg, #92400e, #d97706, #fbbf24)', accent: '#fbbf24', particles: 'leaves' },
  'chapter-4': { grad: 'linear-gradient(135deg, #064e3b, #059669, #34d399)', accent: '#34d399', particles: 'butterflies' },
  'chapter-5': { grad: 'linear-gradient(135deg, #9a3412, #ea580c, #fb923c)', accent: '#fb923c', particles: 'sparkles' },
};
const DEFAULT_THEME = { grad: 'linear-gradient(135deg, #1e293b, #334155)', accent: '#94a3b8', particles: 'sparkles' };

/* ── floating themed particles ── */
function ThemedParticles({ type }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 8,
    })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, bottom: '-20px',
          width: p.size, height: p.size,
          borderRadius: type === 'leaves' ? '50% 0 50% 0' : '50%',
          background: type === 'leaves' ? '#6ee7b7' : type === 'stars' ? '#fbbf24' : type === 'butterflies' ? '#a78bfa' : 'rgba(255,255,255,0.6)',
          opacity: 0.2,
          animation: `particle-rise ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes particle-rise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.3; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-80vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── progress ring ── */
function ProgressRing({ progress, size = 80, stroke = 6, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

/* ── star milestone track ── */
function StarTrack({ progress, accent }) {
  const milestones = [33, 66, 100];
  return (
    <div style={{ position: 'relative', height: 20, margin: '0 10px' }}>
      {/* Track bar */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${Math.min(progress, 100)}%`,
          background: `linear-gradient(90deg, ${accent}, rgba(251,191,36,0.8))`,
          transition: 'width 1s ease',
          boxShadow: `0 0 8px ${accent}`,
        }} />
      </div>
      {/* Star markers */}
      {milestones.map((m, i) => (
        <div key={m} style={{
          position: 'absolute', left: `${m}%`, top: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}>
          <Star size={18}
            fill={progress >= m ? '#fbbf24' : 'transparent'}
            color={progress >= m ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
            style={{
              filter: progress >= m ? 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' : 'none',
              transition: 'all 0.5s',
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── quest mode card ── */
function QuestCard({ icon, accentColor, title, questLabel, description, progress, reward, status, disabled, onClick }) {
  const statusConfig = {
    'in-progress': { label: 'IN PROGRESS', bg: 'rgba(251,191,36,0.15)', color: '#fde68a', border: 'rgba(251,191,36,0.3)' },
    'completed': { label: 'COMPLETED', bg: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: 'rgba(52,211,153,0.3)' },
    'locked': { label: 'LOCKED', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    'coming-soon': { label: 'COMING SOON', bg: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  };
  const st = statusConfig[status] || statusConfig['locked'];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left', width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 22, padding: 0, color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden', fontFamily: "'Nunito', sans-serif",
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${accentColor}33`; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top accent strip */}
      <div style={{ height: 4, background: disabled ? 'rgba(100,116,139,0.3)' : accentColor }} />

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Icon emblem + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${accentColor}22`, border: `2px solid ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: accentColor }}>
              {questLabel}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900 }}>{title}</div>
          </div>
          {/* Status badge */}
          <span style={{
            fontSize: 8.5, fontWeight: 900, padding: '3px 10px', borderRadius: 99,
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            animation: status === 'in-progress' ? 'status-pulse 2s ease-in-out infinite' : 'none',
          }}>
            {st.label}
          </span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          {description}
        </p>

        {/* Progress + reward */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>{progress}</span>
          {reward && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 800, color: '#fbbf24',
              background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: 99,
            }}>
              <Zap size={10} /> {reward}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes status-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </button>
  );
}

export default function IslandOverview() {
  const navigate = useNavigate();
  const { islandId } = useParams();
  const { getIslandById } = useIslands();
  const [progress, setProgress] = useState(() => getStoredStudyProgress());
  const [conversationStats, setConversationStats] = useState(null);

  useEffect(() => {
    let active = true;
    loadStudyProgress().then((normalized) => {
      if (!active) return;
      setProgress(normalized);
      const islandStats = normalized?.conversation?.islands?.[islandId];
      if (islandStats) setConversationStats(islandStats);
    });
    return () => { active = false; };
  }, [islandId]);

  const island = getIslandById(islandId);

  if (!island) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>Island not found.</p>
          <button onClick={() => navigate('/islands')}
            style={{ background: 'white', color: '#0369a1', border: 'none', borderRadius: 14, padding: '10px 18px', fontWeight: 900, cursor: 'pointer' }}>
            Back to Islands
          </button>
        </div>
      </div>
    );
  }

  const islandProgress = getIslandProgress(progress, islandId);
  const unlocked = isIslandUnlocked(progress, islandId);
  const theme = ISLAND_THEMES[island.id] || ISLAND_THEMES[island.type] || DEFAULT_THEME;
  const completedCount = islandProgress.completedLevelIds.length;
  const totalCount = island.levels.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const xpEarned = completedCount * (island.levels[0]?.rewardXp || 5);
  const xpTotal = totalCount * (island.levels[0]?.rewardXp || 5);
  const stars = progressPct >= 100 ? 3 : progressPct >= 66 ? 2 : progressPct >= 33 ? 1 : 0;
  const bossName = island.boss?.name;

  // Determine mode statuses
  const learnStatus = !unlocked ? 'locked' : !island.hasLearn ? 'locked' : completedCount === totalCount ? 'completed' : completedCount > 0 ? 'in-progress' : 'in-progress';
  const drillStatus = !unlocked ? 'locked' : !island.hasDrill ? 'locked' : 'in-progress';
  const converseStatus = !unlocked ? 'locked' : !island.hasConverse ? 'coming-soon' : 'in-progress';

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Nunito', sans-serif",
      background: 'radial-gradient(ellipse at 30% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)',
      color: 'white',
      position: 'relative', overflow: 'hidden',
    }}>
      <ThemedParticles type={theme.particles} />

      {/* Locked overlay */}
      {!unlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fade-in-overlay 0.4s ease',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24, animation: 'pop-scale 0.4s ease-out' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(100,116,139,0.2)', border: '3px solid rgba(100,116,139,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={44} color="rgba(255,255,255,0.5)" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px' }}>{island.intro?.title || island.title}</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Complete the previous island to unlock this world!
            </p>
            <button onClick={() => navigate('/islands')}
              style={{
                border: 'none', borderRadius: 14, padding: '14px 28px', cursor: 'pointer',
                fontWeight: 900, fontSize: 15, color: 'white',
                background: 'rgba(255,255,255,0.15)',
                fontFamily: "'Nunito', sans-serif",
              }}>
              ← Back to World Map
            </button>
          </div>
          <style>{`
            @keyframes fade-in-overlay { from { opacity: 0; } to { opacity: 1; } }
            @keyframes pop-scale { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
        {/* Back button */}
        <button onClick={() => navigate('/islands')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 18,
            background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
            padding: '9px 16px', borderRadius: 50, cursor: 'pointer',
            color: 'white', fontWeight: 800, fontSize: 13,
          }}>
          <ArrowLeft size={15} /> All Islands
        </button>

        {/* ── Hero Banner ── */}
        <div style={{
          borderRadius: 28, overflow: 'hidden',
          background: theme.grad,
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 30px ${theme.accent}22`,
          marginBottom: 20,
        }}>
          <div style={{ padding: '28px 28px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Progress ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing progress={progressPct} color={progressPct === 100 ? '#fbbf24' : 'rgba(255,255,255,0.9)'} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: 'white',
              }}>
                {progressPct === 100 ? <Trophy size={28} color="#fbbf24" /> : `${progressPct}%`}
              </div>
            </div>

            {/* Island info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)', marginBottom: 4,
              }}>
                {island.type === 'alphabet' ? 'Foundations' : island.type === 'conversation' ? 'Conversation' : 'Vocabulary'} · {island.difficulty}
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                {island.intro?.title || island.title}
              </h1>

              {/* Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                {[1, 2, 3].map(s => (
                  <Star key={s} size={16}
                    fill={s <= stars ? '#fbbf24' : 'transparent'}
                    color={s <= stars ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
                    style={{ filter: s <= stars ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' : 'none' }}
                  />
                ))}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginLeft: 8 }}>
                  {completedCount}/{totalCount} Levels
                </span>
              </div>

              {/* XP + Boss chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: 'rgba(251,191,36,0.15)', color: '#fde68a',
                }}>
                  <Zap size={10} /> {xpEarned}/{xpTotal} XP
                </span>
                {bossName && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                    background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                  }}>
                    <Flame size={10} /> Boss: {bossName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Star milestone track */}
          <div style={{ padding: '0 24px 18px' }}>
            <StarTrack progress={progressPct} accent={theme.accent} />
          </div>

          {/* Story text */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', padding: '14px 24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              {island.intro?.story}
            </p>
          </div>

          {/* Tip bar */}
          <div style={{
            padding: '10px 24px', background: 'rgba(253,224,71,0.08)',
            borderTop: '1px solid rgba(253,224,71,0.15)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#fde68a',
          }}>
            <Lightbulb size={13} style={{ flexShrink: 0 }} />
            <span><strong>Tip:</strong> {island.intro?.hint}</span>
          </div>
        </div>

        {/* ── Quest Board: Mode Cards ── */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <QuestCard
            icon={<BookOpen size={22} color={island.hasLearn ? '#60a5fa' : 'rgba(255,255,255,0.3)'} />}
            accentColor={island.hasLearn ? '#60a5fa' : 'rgba(255,255,255,0.3)'}
            questLabel="Learn Quest"
            title="Learn"
            description={
              island.hasLearn
                ? `Master each sign one by one with the camera coach. ${totalCount} levels of hands-on practice!`
                : 'Learn mode is not available for this island.'
            }
            progress={island.hasLearn ? `${completedCount}/${totalCount} levels` : 'Not available'}
            reward={island.hasLearn ? `+${island.levels[0]?.rewardXp || 5} XP / level` : null}
            status={learnStatus}
            disabled={!unlocked || !island.hasLearn}
            onClick={() => island.hasLearn && navigate(`/study/${islandId}`)}
          />

          <QuestCard
            icon={<Target size={22} color={island.hasDrill ? '#fbbf24' : 'rgba(255,255,255,0.3)'} />}
            accentColor={island.hasDrill ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
            questLabel="Drill Challenge"
            title="Drill"
            description={
              island.hasDrill
                ? 'Rapid-fire recall across the full sign set. Speed and accuracy matter!'
                : 'Drill mode is not available for this island.'
            }
            progress={island.hasDrill ? 'Open practice' : 'Not available'}
            reward={island.hasDrill ? 'Speed bonus' : null}
            status={drillStatus}
            disabled={!unlocked || !island.hasDrill}
            onClick={() => island.hasDrill && navigate('/practice')}
          />

          <QuestCard
            icon={<MessageCircle size={22} color={island.hasConverse ? '#34d399' : 'rgba(255,255,255,0.3)'} />}
            accentColor={island.hasConverse ? '#34d399' : 'rgba(255,255,255,0.3)'}
            questLabel="Converse Mission"
            title="Converse"
            description={
              island.hasConverse
                ? 'Reply to NPC prompts in real conversations. Where signing becomes a real skill!'
                : 'Reply Quest unlocks on this island in a future phase.'
            }
            progress={
              island.hasConverse
                ? conversationStats
                  ? `${conversationStats.prompts_correct || 0} correct · ${conversationStats.sessions_completed || 0} sessions`
                  : 'Ready to start'
                : 'Coming soon'
            }
            reward={island.hasConverse ? 'Mastery XP' : null}
            status={converseStatus}
            disabled={!unlocked || !island.hasConverse}
            onClick={() => island.hasConverse && navigate(`/islands/${islandId}/converse`)}
          />
        </div>
      </div>
    </div>
  );
}
