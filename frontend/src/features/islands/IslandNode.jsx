import React from 'react';

export default function IslandNode({
  island,
  locked,
  completed,
  active,
  isLast,
  onClick
}) {
  const typeColors = {
    alphabet: { surface: '#34d399', edge: '#065f46', shadow: '#022c22', accent: '#10b981', highlight: '#6ee7b7' },
    conversation: { surface: '#60a5fa', edge: '#1e3a8a', shadow: '#172554', accent: '#3b82f6', highlight: '#93c5fd' },
    vocabulary: { surface: '#fbbf24', edge: '#713f12', shadow: '#422006', accent: '#d97706', highlight: '#fde68a' }
  };

  const colors = locked 
    ? { surface: '#64748b', edge: '#334155', shadow: '#0f172a', accent: '#475569', highlight: '#94a3b8' }
    : typeColors[island.type] || typeColors.vocabulary;

  // Base random seed offset based on island ID to keep variations consistent per island
  const seed = (island.id.charCodeAt(0) || 0) + (island.id.charCodeAt(1) || 0);
  const getRand = (min, max, offset) => min + ((seed + offset) % (max - min));

  // Visual features of the island based on type
  const renderIslandFeatures = () => {
    const opacity = locked ? 0.4 : 1;
    
    if (island.type === 'alphabet') {
      return (
        <g opacity={opacity} style={{ transition: 'opacity 0.5s' }}>
          {/* Detailed Trees (Isometric-ish) */}
          <g transform={`translate(${getRand(20, 30, 1)}, ${getRand(8, 14, 2)})`}>
            <path d="M0,0 Q5,-15 15,-10 Q20,-5 10,5 Z" fill="#047857" />
            <path d="M2,2 Q8,-10 12,-6 Q15,-2 8,6 Z" fill="#059669" />
            <circle cx="8" cy="-5" r="7" fill={colors.highlight} opacity="0.6" />
          </g>
          <g transform={`translate(${getRand(65, 75, 3)}, ${getRand(10, 18, 4)})`}>
            <ellipse cx="0" cy="5" rx="12" ry="5" fill="#064e3b" opacity="0.2"/>
            <path d="M-8,-5 Q0,-25 15,-5 Q10,5 -5,5 Z" fill="#059669" />
            <path d="M-4,-2 Q4,-20 12,-4 Q8,4 -2,4 Z" fill="#10b981" />
            <circle cx="5" cy="-8" r="6" fill={colors.highlight} opacity="0.4" />
          </g>
          <g transform={`translate(${getRand(15, 25, 5)}, ${getRand(20, 25, 6)})`}>
            <circle cx="0" cy="0" r="10" fill="#059669" />
            <circle cx="2" cy="-2" r="7" fill="#10b981" />
          </g>
          {/* Small bushes */}
          <circle cx="82" cy="18" r="5" fill="#10b981"/>
          <circle cx="85" cy="22" r="4" fill="#047857"/>
        </g>
      );
    }
    
    if (island.type === 'conversation') {
      return (
        <g opacity={opacity} style={{ transition: 'opacity 0.5s' }}>
          {/* Isometric Stylized City / Data structures */}
          <g transform={`translate(${getRand(15, 25, 1)}, ${getRand(8, 12, 2)})`}>
             {/* Box 1 */}
             <polygon points="10,0 20,-5 30,0 20,5" fill={colors.highlight} />
             <polygon points="10,0 20,5 20,25 10,20" fill={colors.accent} />
             <polygon points="30,0 20,5 20,25 30,20" fill={colors.edge} />
          </g>
          <g transform={`translate(${getRand(50, 65, 3)}, ${getRand(2, 6, 4)})`}>
             {/* Box 2 (Taller) */}
             <polygon points="12,0 25,-6 38,0 25,6" fill={colors.highlight} />
             <polygon points="12,0 25,6 25,35 12,29" fill={colors.accent} />
             <polygon points="38,0 25,6 25,35 38,29" fill={colors.edge} />
             {/* glowing windows */}
             <rect x="15" y="8" width="3" height="4" fill="#fff" opacity="0.6" transform="skewY(25)"/>
             <rect x="15" y="16" width="3" height="4" fill="#fff" opacity="0.6" transform="skewY(25)"/>
             <rect x="29" y="4" width="3" height="4" fill="#60a5fa" opacity="0.6" transform="skewY(-25)"/>
             <rect x="29" y="12" width="3" height="4" fill="#60a5fa" opacity="0.6" transform="skewY(-25)"/>
          </g>
        </g>
      );
    }
    
    // Vocabulary (crystals / terrain)
    return (
      <g opacity={opacity} style={{ transition: 'opacity 0.5s' }}>
        {/* Glowing Crystals */}
        <g transform={`translate(${getRand(25, 35, 1)}, ${getRand(12, 18, 2)})`}>
          <polygon points="0,15 -8,5 -5,-15 5,-25 12,-10 8,10" fill={colors.shadow} />
          <polygon points="0,15 -8,5 -5,-15 0,-18 5,0" fill={colors.accent} />
          <polygon points="0,15 5,0 0,-18 5,-25 12,-10 8,10" fill={colors.highlight} opacity="0.8" />
        </g>
        <g transform={`translate(${getRand(60, 70, 3)}, ${getRand(8, 14, 4)}) scale(0.8)`}>
          <polygon points="0,15 -8,5 -5,-15 5,-25 12,-10 8,10" fill={colors.shadow} />
          <polygon points="0,15 -8,5 -5,-15 0,-18 5,0" fill={colors.accent} />
          <polygon points="0,15 5,0 0,-18 5,-25 12,-10 8,10" fill={colors.highlight} opacity="0.8" />
        </g>
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div 
        className="island-node"
        onClick={() => !locked && onClick()}
        style={{
          position: 'relative',
          cursor: locked ? 'not-allowed' : 'pointer',
          transform: active ? 'translateY(-12px)' : 'none',
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          margin: '0 10px',
        }}
        onMouseEnter={(e) => {
          if (!locked) {
             e.currentTarget.style.transform = active ? 'translateY(-18px) scale(1.03)' : 'translateY(-6px) scale(1.03)';
             const tooltip = e.currentTarget.querySelector('.tooltip');
             if (tooltip) {
               tooltip.style.opacity = '1';
               tooltip.style.visibility = 'visible';
               tooltip.style.transform = 'translateY(0) scale(1)';
             }
          }
        }}
        onMouseLeave={(e) => {
          if (!locked) {
             e.currentTarget.style.transform = active ? 'translateY(-12px)' : 'none';
             const tooltip = e.currentTarget.querySelector('.tooltip');
             if (tooltip) {
               tooltip.style.opacity = '0';
               tooltip.style.visibility = 'hidden';
               tooltip.style.transform = 'translateY(15px) scale(0.95)';
             }
          }
        }}
      >
        {/* Floating Aura for Active Node */}
        {active && (
          <div style={{
            position: 'absolute', top: -40, left: -40, right: -40, bottom: -40,
            background: `radial-gradient(circle, ${colors.surface}4D 0%, transparent 60%)`,
            zIndex: 0, pointerEvents: 'none',
            animation: 'pulse-glow 2.5s infinite ease-in-out'
          }} />
        )}

        {/* 3D SVG Island Graphic */}
        <div style={{ position: 'relative', zIndex: 1, filter: locked ? 'grayscale(80%) drop-shadow(0 15px 15px rgba(0,0,0,0.5))' : 'drop-shadow(0 20px 25px rgba(0,0,0,0.4))' }}>
          <svg width="150" height="130" viewBox="0 -10 110 90" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id={`gradTop-${island.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.4" />
                <stop offset="100%" stopColor={colors.surface} />
              </linearGradient>
              <linearGradient id={`gradSide-${island.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.edge} />
                <stop offset="100%" stopColor={colors.shadow} />
              </linearGradient>
              <filter id={`glow-${island.id}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Island Base (Deep 3D) */}
            <path d="M5 40 C 20 60, 90 60, 105 40 L 98 75 C 80 95, 30 95, 12 75 Z" fill={`url(#gradSide-${island.id})`} />
            
            {/* Inner terrain crust layer */}
            <path d="M5 40 C 20 62, 90 62, 105 40 L 102 46 C 85 68, 25 68, 8 46 Z" fill={colors.surface} opacity="0.6"/>
            
            {/* Island Surface */}
            <path d="M5 40 C 20 25, 90 25, 105 40 C 90 55, 20 55, 5 40 Z" fill={`url(#gradTop-${island.id})`} />
            
            {/* Surface details / grid lines / texture */}
            {!locked && (
              <path d="M 25 35 C 40 45, 70 45, 85 35" stroke={colors.highlight} strokeWidth="1" opacity="0.3" fill="none" />
            )}

            {/* Features (trees, city, crystals) */}
            {renderIslandFeatures()}
            
            {/* Status floating badge */}
            <g transform={`translate(42, ${active ? 2 : 12})`} filter={active ? `url(#glow-${island.id})` : undefined}>
              {completed && (
                <g>
                  <circle cx="13" cy="13" r="14" fill="#10b981" stroke="#064e3b" strokeWidth="2" />
                  <path d="M7 13 L11 17 L19 9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {locked && (
                <g>
                   <circle cx="13" cy="13" r="14" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                   <path d="M9 12 V10 A4 4 0 0 1 17 10 V12 H19 V18 H7 V12 Z" fill="#94a3b8" />
                   <path d="M10 12 V10 A3 3 0 0 1 16 10 V12" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                </g>
              )}
              {active && (
                <g>
                  {/* Glowing star for active */}
                  <circle cx="13" cy="13" r="15" fill={colors.highlight} stroke="#fff" strokeWidth="2" />
                  <path d="M13 5 L15 10 L20 11 L16 15 L17 20 L13 18 L9 20 L10 15 L6 11 L11 10 Z" fill="#ffffff" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="2s" repeatCount="indefinite" />
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Hover Tooltip */}
        <div 
          className="tooltip"
          style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            opacity: 0, visibility: 'hidden',
            transition: 'all 0.2s', paddingBottom: 16, zIndex: 10,
            pointerEvents: 'none', width: 220
          }}
        >
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)', border: `1.5px solid ${colors.surface}`,
            borderRadius: 16, padding: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            color: 'white', textAlign: 'center', backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: colors.surface, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {island.type}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, margin: '4px 0 8px' }}>
              {island.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {island.hasLearn && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }}>Learn</span>
              )}
              {island.hasDrill && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(251,191,36,0.15)', color: '#fde68a' }}>Drill</span>
              )}
              {island.hasConverse && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', color: '#6ee7b7' }}>Converse</span>
              )}
            </div>

            {island.situations && island.situations.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 8, textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  📍 Situations
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {island.situations.map((sit, idx) => (
                    <div key={idx} title={sit.description} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 8 }}>
                      <span style={{ fontSize: 14 }}>{sit.emoji}</span>
                      <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{sit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {island.situations && island.situations.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 8, textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  📍 Situations
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {island.situations.map((sit, idx) => (
                    <div key={idx} title={sit.description} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 8 }}>
                      <span style={{ fontSize: 14 }}>{sit.emoji}</span>
                      <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{sit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {island.masteryScores && island.masteryScores.is_unlocked && (
              <div style={{ marginTop: 10, marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Mastery Axes</div>
                {[
                  { label: "Accuracy", score: island.masteryScores.accuracy_score || 0, color: "#34d399" },
                  { label: "Comprehension", score: island.masteryScores.comprehension_score || 0, color: "#60a5fa" },
                  { label: "Timing", score: island.masteryScores.timing_score || 0, color: "#a855f7" }
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', fontWeight: 800 }}>{stat.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 44, height: 4.5, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
                         <div style={{ height: '100%', width: `${stat.score}%`, background: stat.color, borderRadius: 99, transition: 'width 0.5s ease-out' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'white', fontWeight: 900, width: 20, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{stat.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${island.totalLevels ? Math.round((island.doneLevels / island.totalLevels) * 100) : 0}%`,
                background: colors.surface,
              }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              {island.doneLevels}/{island.totalLevels} levels
            </div>
          </div>
        </div>

        {/* Floating title below island */}
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', width: 140, marginTop: 8,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: locked ? '#94a3b8' : 'white' }}>
            {island.title}
          </div>
          {locked && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>Locked</div>}
        </div>
      </div>

      {/* Path to next island */}
      {!isLast && (
        <div style={{
          width: 100, height: 60, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="100" height="60" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="glow-path" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Curving decorative path instead of a straight dash */}
            <path 
              d="M 10 30 C 35 15, 65 45, 90 30" 
              fill="none" 
              stroke={island.completed ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"} 
              strokeWidth="12" 
              strokeLinecap="round" 
            />
            {/* Stepping stones */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
              // Cubic bezier interpolation for dots
              const x = Math.round(Math.pow(1 - t, 3) * 10 + 3 * Math.pow(1 - t, 2) * t * 35 + 3 * (1 - t) * Math.pow(t, 2) * 65 + Math.pow(t, 3) * 90);
              const y = Math.round(Math.pow(1 - t, 3) * 30 + 3 * Math.pow(1 - t, 2) * t * 15 + 3 * (1 - t) * Math.pow(t, 2) * 45 + Math.pow(t, 3) * 30);
              return (
                <g key={t} transform={`translate(${x}, ${y})`}>
                  <ellipse cx="0" cy="0" rx="5" ry="3" fill={island.completed ? "#34d399" : "#475569"} filter={island.completed ? "url(#glow-path)" : undefined} />
                  <ellipse cx="0" cy="-1" rx="5" ry="3" fill={island.completed ? "#6ee7b7" : "#64748b"} />
                </g>
              );
            })}
            
            {/* Animated traveler light if complete */}
            {island.completed && (
              <circle r="4" fill="#fff" filter="url(#glow-path)">
                <animateMotion 
                  dur="3s" 
                  repeatCount="indefinite" 
                  path="M 10 30 C 35 15, 65 45, 90 30" 
                />
              </circle>
            )}
          </svg>
        </div>
      )}
      
      <style>{`
        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
