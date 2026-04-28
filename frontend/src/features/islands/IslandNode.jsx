import React, { useMemo } from 'react';
import { Lock, Star, ChevronRight, Trophy, Flame, Palmtree, Hand, Lightbulb, MessageSquare, Users, Leaf, Home } from 'lucide-react';

/* ── per-island theme palette ── */
const ISLAND_THEMES = {
  alphabet: { grad: 'linear-gradient(135deg, #0f766e, #0ea5a4, #5eead4)', accent: '#5eead4', glow: 'rgba(45,212,191,0.35)', Icon: Palmtree, label: 'Shoreline' },
  greetings: { grad: 'linear-gradient(135deg, #9a3412, #f97316, #fdba74)', accent: '#fb923c', glow: 'rgba(249,115,22,0.35)', Icon: Hand, label: 'Conversation Bay' },
  conversation: { grad: 'linear-gradient(135deg, #9a3412, #f97316, #fdba74)', accent: '#fb923c', glow: 'rgba(249,115,22,0.35)', Icon: Hand, label: 'Conversation Bay' },
};

const ZONE_THEMES = {
  shore: { grad: 'linear-gradient(135deg, #0f766e, #0ea5a4, #5eead4)', accent: '#5eead4', glow: 'rgba(94, 234, 212, 0.35)', Icon: Palmtree, label: 'Shoreline' },
  sunlit: { grad: 'linear-gradient(135deg, #0369a1, #0ea5e9, #7dd3fc)', accent: '#7dd3fc', glow: 'rgba(125, 211, 252, 0.35)', Icon: Lightbulb, label: 'Sunlit Zone' },
  twilight: { grad: 'linear-gradient(135deg, #1d4ed8, #2563eb, #60a5fa)', accent: '#60a5fa', glow: 'rgba(96, 165, 250, 0.35)', Icon: MessageSquare, label: 'Twilight Zone' },
  midnight: { grad: 'linear-gradient(135deg, #312e81, #4338ca, #6366f1)', accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.35)', Icon: Users, label: 'Midnight Zone' },
  abyss: { grad: 'linear-gradient(135deg, #312e81, #3730a3, #4f46e5)', accent: '#a78bfa', glow: 'rgba(167, 139, 250, 0.35)', Icon: Leaf, label: 'The Abyss' },
  trenches: { grad: 'linear-gradient(135deg, #0f172a, #172554, #1e1b4b)', accent: '#c4b5fd', glow: 'rgba(196, 181, 253, 0.35)', Icon: Home, label: 'Trenches' },
};

const DEFAULT_THEME = { grad: 'linear-gradient(135deg, #334155, #475569, #64748b)', accent: '#94a3b8', glow: 'rgba(148,163,184,0.35)', Icon: Star, label: 'Unknown' };

const toDiveLabel = (value = '') => value;

/* ── SVG decorations per theme ── */
function IslandDecoration({ type }) {
  if (type === 'alphabet') return (
    <g opacity="0.45">
      <path d="M15 55 Q18 35 25 40 Q30 48 20 55Z" fill="#047857" />
      <path d="M22 52 Q26 32 33 38 Q37 46 27 53Z" fill="#10b981" />
      <circle cx="27" cy="36" r="5" fill="#6ee7b7" opacity="0.7"/>
      <path d="M60 50 Q63 30 70 38 Q74 46 64 52Z" fill="#059669" />
      <path d="M66 48 Q70 28 76 35 Q80 43 70 50Z" fill="#34d399" />
      <circle cx="72" cy="32" r="4" fill="#a7f3d0" opacity="0.6"/>
    </g>
  );
  if (type === 'conversation' || type === 'greetings') return (
    <g opacity="0.4">
      <path d="M20 52 L25 35 L30 52Z" fill="#fdba74" />
      <path d="M55 48 L60 28 L65 48Z" fill="#f97316" />
      <circle cx="42" cy="42" r="8" fill="#fef3c7" opacity="0.4"/>
      <path d="M70 55 Q72 45 75 55Z" fill="#fb923c" opacity="0.6"/>
    </g>
  );
  // vocabulary types
  return (
    <g opacity="0.4">
      <polygon points="25,50 20,35 30,28 35,40" fill="currentColor" opacity="0.6"/>
      <polygon points="60,48 55,30 65,25 70,38" fill="currentColor" opacity="0.5"/>
      <circle cx="45" cy="40" r="6" fill="currentColor" opacity="0.3"/>
    </g>
  );
}

/* ── progress ring ── */
function ProgressRing({ progress, size = 52, stroke = 4, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

export default function IslandNode({ island, locked, completed, active, isLast, onClick }) {
  const theme = ISLAND_THEMES[island.id]
    || ISLAND_THEMES[island.type]
    || ZONE_THEMES[island.zoneKey]
    || DEFAULT_THEME;

  const zoneLabel = island.zoneName || theme.label;
  const displayTitle = toDiveLabel(island.title || '');
  const depthLabel = Number.isFinite(island.depthMeters) ? `${Math.round(island.depthMeters).toLocaleString()}m` : null;
  const progressPct = island.totalLevels ? Math.round((island.doneLevels / island.totalLevels) * 100) : 0;
  const stars = useMemo(() => {
    if (!island.totalLevels) return 0;
    const pct = island.doneLevels / island.totalLevels;
    if (pct >= 1) return 3;
    if (pct >= 0.66) return 2;
    if (pct >= 0.33) return 1;
    return 0;
  }, [island.doneLevels, island.totalLevels]);

  const bossName = island.boss?.name || null;

  return (
    <div
      onClick={() => !locked && onClick()}
      style={{
        position: 'relative',
        cursor: locked ? 'not-allowed' : 'pointer',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        borderRadius: 28,
        overflow: 'hidden',
        background: locked
          ? 'rgba(30,41,59,0.7)'
          : `${theme.grad}`,
        border: `2px solid ${active ? theme.accent : locked ? 'rgba(100,116,139,0.4)' : 'rgba(255,255,255,0.15)'}`,
        boxShadow: active
          ? `0 0 30px ${theme.glow}, 0 12px 40px rgba(0,0,0,0.4)`
          : locked
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : '0 8px 32px rgba(0,0,0,0.35)',
        opacity: locked ? 0.65 : 1,
        filter: locked ? 'saturate(0.3)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: active ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!locked) {
          e.currentTarget.style.transform = 'scale(1.04) translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 0 40px ${theme.glow}, 0 20px 50px rgba(0,0,0,0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!locked) {
          e.currentTarget.style.transform = active ? 'scale(1.02)' : 'scale(1)';
          e.currentTarget.style.boxShadow = active
            ? `0 0 30px ${theme.glow}, 0 12px 40px rgba(0,0,0,0.4)`
            : '0 8px 32px rgba(0,0,0,0.35)';
        }
      }}
    >
      {/* Active pulse ring */}
      {active && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: 30, pointerEvents: 'none', zIndex: 0,
          border: `2px solid ${theme.accent}`,
          animation: 'island-pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Island card content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Left: Icon area with SVG decoration */}
        <div style={{ position: 'relative', flexShrink: 0, width: 90, height: 80 }}>
          <svg width="90" height="80" viewBox="0 0 90 80" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Island base shape */}
            <ellipse cx="45" cy="58" rx="42" ry="16" fill="rgba(0,0,0,0.25)" />
            <ellipse cx="45" cy="52" rx="38" ry="14" fill="rgba(255,255,255,0.1)" />
            <IslandDecoration type={island.type === 'conversation' ? 'greetings' : island.id.startsWith('chapter') ? 'vocabulary' : island.type} />
          </svg>
          {/* Icon overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
            width: 48, height: 48, borderRadius: 16,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {locked ? <Lock size={22} color="rgba(255,255,255,0.5)" /> : <theme.Icon size={22} color="white" />}
          </div>
        </div>

        {/* Center: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Subtitle + difficulty */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {zoneLabel}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
              background: island.difficulty === 'Easy' ? 'rgba(52,211,153,0.25)' : island.difficulty === 'Medium' ? 'rgba(251,191,36,0.25)' : 'rgba(239,68,68,0.25)',
              color: island.difficulty === 'Easy' ? '#6ee7b7' : island.difficulty === 'Medium' ? '#fde68a' : '#fca5a5',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {island.difficulty}
            </span>
            {depthLabel && (
              <span style={{
                fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(15, 23, 42, 0.4)',
                color: 'rgba(219, 234, 254, 0.95)',
                letterSpacing: '0.08em',
              }}>
                {depthLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{
            margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayTitle}
          </h3>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
            {[1, 2, 3].map(s => (
              <Star key={s} size={14}
                fill={s <= stars ? '#fbbf24' : 'transparent'}
                color={s <= stars ? '#fbbf24' : 'rgba(255,255,255,0.25)'}
                style={{ transition: 'all 0.3s' }}
              />
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginLeft: 6 }}>
              {island.doneLevels}/{island.totalLevels} levels
            </span>
          </div>

          {/* Boss teaser */}
          {bossName && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 800, color: '#fbbf24',
              background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: 99,
            }}>
              <Flame size={10} /> Boss: {bossName}
            </div>
          )}
        </div>

        {/* Right: Progress ring + action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <ProgressRing progress={progressPct} color={completed ? '#fbbf24' : theme.accent} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: 'white',
            }}>
              {completed ? <Trophy size={18} color="#fbbf24" /> : `${progressPct}%`}
            </div>
          </div>
          {active && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '4px 12px', borderRadius: 99,
              background: theme.accent, color: '#000',
              fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              Play <ChevronRight size={12} />
            </div>
          )}
          {completed && (
            <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cleared!
            </span>
          )}
          {locked && (
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Bottom XP bar */}
      <div style={{
        height: 4, background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          height: '100%', width: `${progressPct}%`,
          background: completed ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : `linear-gradient(90deg, ${theme.accent}, rgba(255,255,255,0.6))`,
          borderRadius: '0 4px 4px 0',
          transition: 'width 0.8s ease',
        }} />
      </div>

      <style>{`
        @keyframes island-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
