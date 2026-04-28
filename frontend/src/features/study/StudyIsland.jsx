import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Play, Star, Zap, Target, Flame, Crown, ChevronRight, Trophy } from 'lucide-react';
import {
  getInitialStudyProgress,
  getStoredStudyProgress,
  loadStudyProgress,
  saveStudyProgress,
  isIslandUnlocked,
  isLevelCompleted,
  getIslandProgress,
  isBossLevel,
  getLevelDifficultyZone,
} from './studyVoyage';
import { useIslands } from '../../contexts/IslandsContext';

const DIFF_COLORS = {
  Beginner: { bg: 'rgba(52,211,153,0.15)', text: '#6ee7b7', border: 'rgba(52,211,153,0.3)' },
  Easy:     { bg: 'rgba(34,211,238,0.15)', text: '#67e8f9', border: 'rgba(34,211,238,0.3)' },
  Medium:   { bg: 'rgba(251,191,36,0.15)', text: '#fde68a', border: 'rgba(251,191,36,0.3)' },
  Hard:     { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
};

/* ── snake path layout calculator ── */
function getSnakePosition(index, total) {
  const ITEMS_PER_ROW = 5;
  const row = Math.floor(index / ITEMS_PER_ROW);
  const colIndex = index % ITEMS_PER_ROW;
  const isReversed = row % 2 === 1;
  const col = isReversed ? ITEMS_PER_ROW - 1 - colIndex : colIndex;
  return { row, col, isReversed };
}

/* ── milestone marker ── */
function MilestoneMarker({ index }) {
  return (
    <div style={{
      position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      zIndex: 5, pointerEvents: 'none',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        border: '2px solid #fde68a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(251,191,36,0.4)',
      }}>
        <Star size={12} fill="#fff" color="#fff" />
      </div>
    </div>
  );
}

/* ── level node on the snake path ── */
function LevelNode({ level, index, completed, levelUnlocked, isBoss, bossInfo, isCurrentNext, onClick, totalLevels }) {
  const zone = getLevelDifficultyZone(index, totalLevels);
  const zoneColor = DIFF_COLORS[zone] || DIFF_COLORS.Easy;
  const nodeSize = isBoss ? 80 : 56;

  return (
    <div
      onClick={() => levelUnlocked && onClick()}
      style={{
        position: 'relative',
        width: nodeSize, height: nodeSize,
        cursor: levelUnlocked ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        animation: isCurrentNext ? 'node-bounce 2s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={(e) => { if (levelUnlocked) e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={(e) => { if (levelUnlocked) e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Milestone marker every 6 levels */}
      {index > 0 && index % 6 === 0 && !isBoss && <MilestoneMarker index={index} />}

      {/* Boss glow aura */}
      {isBoss && isCurrentNext && (
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: `radial-gradient(circle, ${bossInfo?.border_color || '#fbbf24'}55, transparent 70%)`,
          animation: 'boss-pulse 1.5s ease-in-out infinite',
          zIndex: 0,
        }} />
      )}

      {/* Node circle */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: completed
          ? 'linear-gradient(135deg, #34d399, #22d3ee)'
          : isBoss
          ? isCurrentNext
            ? `linear-gradient(135deg, #ef4444, ${bossInfo?.border_color || '#fbbf24'})`
            : levelUnlocked
            ? 'linear-gradient(135deg, #b91c1c, #991b1b)'
            : 'rgba(30,41,59,0.8)'
          : levelUnlocked
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(15,23,42,0.8)',
        border: completed
          ? '3px solid #6ee7b7'
          : isBoss
          ? `3px solid ${isCurrentNext ? bossInfo?.border_color || '#fbbf24' : levelUnlocked ? '#ef4444' : 'rgba(100,116,139,0.4)'}`
          : levelUnlocked
          ? `3px solid ${isCurrentNext ? '#60a5fa' : 'rgba(255,255,255,0.25)'}`
          : '3px solid rgba(100,116,139,0.25)',
        boxShadow: completed
          ? '0 4px 16px rgba(52,211,153,0.4)'
          : isBoss && isCurrentNext
          ? `0 0 20px ${bossInfo?.border_color || '#fbbf24'}66, 0 8px 24px rgba(0,0,0,0.4)`
          : isCurrentNext
          ? '0 0 16px rgba(96,165,250,0.4), 0 8px 24px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 1,
        transition: 'all 0.3s',
      }}>
        {/* Content */}
        {completed ? (
          <CheckCircle2 size={isBoss ? 28 : 20} color="white" />
        ) : isBoss ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 18 }}>{bossInfo?.icon || '👑'}</span>
          </div>
        ) : levelUnlocked ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isBoss ? 16 : 14, fontWeight: 900, color: 'white', lineHeight: 1 }}>
              {level.label}
            </div>
          </div>
        ) : (
          <Lock size={isBoss ? 22 : 14} color="rgba(255,255,255,0.35)" />
        )}
      </div>

      {/* Label below */}
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        {isBoss ? (
          <div style={{
            fontSize: 8, fontWeight: 900, color: bossInfo?.border_color || '#fbbf24',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Flame size={8} /> FINAL
          </div>
        ) : (
          <div style={{
            fontSize: 9, fontWeight: 800, color: completed ? '#6ee7b7' : levelUnlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
          }}>
            {level.order}
          </div>
        )}
      </div>

      {/* Completed star */}
      {completed && (
        <div style={{
          position: 'absolute', top: -4, right: -4, zIndex: 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fbbf24', border: '2px solid #fde68a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(251,191,36,0.4)',
        }}>
          <Star size={9} fill="white" color="white" />
        </div>
      )}
    </div>
  );
}

export default function StudyIsland() {
  const { islandId } = useParams();
  const navigate = useNavigate();
  const { getIslandById, islandsLoading } = useIslands();
  const [progress, setProgress] = useState(getInitialStudyProgress());
  const nextLevelRef = useRef(null);

  useEffect(() => {
    let active = true;
    const cached = getStoredStudyProgress();
    setProgress(cached);
    loadStudyProgress().then((normalized) => {
      if (!active) return;
      setProgress(normalized);
      saveStudyProgress(normalized);
    });
    return () => { active = false; };
  }, []);

  const island = getIslandById(islandId);
  const islandProgress = useMemo(() => getIslandProgress(progress, islandId), [progress, islandId]);

  // These computed values need to be safe for null island (before early returns)
  const phraseCompleteCount = island ? island.levels.filter(l => isLevelCompleted(progress, island.id, l.id)).length : 0;
  const nextPhraseLevel = island ? island.levels.find(l => !isLevelCompleted(progress, island.id, l.id)) : null;
  const progressPct = island ? Math.round((phraseCompleteCount / Math.max(island.levels.length, 1)) * 100) : 0;
  const bossInfo = island?.boss || null;
  const unlocked = island ? isIslandUnlocked(progress, island.id) : false;

  // ALL hooks must be above early returns
  useEffect(() => {
    if (nextLevelRef.current) {
      setTimeout(() => {
        nextLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [nextPhraseLevel?.id]);

  if (islandsLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white', fontFamily: "'Nunito',sans-serif" }}>
        <div style={{ textAlign: 'center', opacity: 0.7, fontWeight: 700, fontSize: 16 }}>Rendering Island Data…</div>
      </div>
    );
  }

  if (!island) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white', fontFamily: "'Nunito',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 900, margin: '0 0 16px' }}>Island not found.</p>
          <button onClick={() => navigate('/islands')}
            style={{ border: 'none', borderRadius: 14, padding: '12px 22px', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontFamily: "'Nunito',sans-serif" }}>
            Back to World Map
          </button>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white', fontFamily: "'Nunito',sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={34} color="rgba(255,255,255,0.8)" />
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>{island.title} is Locked</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 22 }}>
            Clear the previous island first to unlock this island.
          </p>
          <button onClick={() => navigate('/islands')}
            style={{ border: 'none', borderRadius: 14, padding: '12px 22px', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontFamily: "'Nunito',sans-serif" }}>
            Back to World Map
          </button>
        </div>
      </div>
    );
  }

  const launchLevel = (levelId) => navigate(`/study/${island.id}/level/${levelId}`);

  // Calculate snake grid layout
  const ITEMS_PER_ROW = 5;
  const totalRows = Math.ceil(island.levels.length / ITEMS_PER_ROW);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)',
      color: 'white',
      fontFamily: "'Nunito', sans-serif",
    }}>
      {/* ── sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button onClick={() => navigate(`/islands/${island.id}`)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
              <ArrowLeft size={16} color="white" />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{island.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                  background: island.difficulty === 'Easy' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)',
                  color: island.difficulty === 'Easy' ? '#6ee7b7' : '#fde68a',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {island.difficulty}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                  {phraseCompleteCount}/{island.levels.length} levels
                </span>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '6px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progress</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399' }}>{progressPct}%</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${progressPct}%`, transition: 'width 0.8s ease',
              background: progressPct === 100 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#34d399,#22d3ee)',
              boxShadow: '0 0 8px rgba(52,211,153,0.4)',
            }} />
          </div>
        </div>
      </header>

      <main style={{ padding: '24px 20px 120px', maxWidth: 700, margin: '0 auto' }}>
        {/* Continue button */}
        {nextPhraseLevel && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
            borderRadius: 18, padding: '14px 18px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target size={14} color="white" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
                {isBossLevel(island.levels.indexOf(nextPhraseLevel), island.levels.length)
                  ? `🔥 Boss Challenge: ${nextPhraseLevel.label}`
                  : `Next: Level ${nextPhraseLevel.order} — ${nextPhraseLevel.label}`}
              </span>
            </div>
            <button onClick={() => launchLevel(nextPhraseLevel.id)}
              style={{
                border: 'none', borderRadius: 12, padding: '10px 18px', cursor: 'pointer',
                fontWeight: 900, fontSize: 13,
                background: isBossLevel(island.levels.indexOf(nextPhraseLevel), island.levels.length)
                  ? 'linear-gradient(135deg, #ef4444, #fbbf24)'
                  : 'linear-gradient(135deg, #34d399, #22d3ee)',
                color: '#000', fontFamily: "'Nunito',sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Play size={12} fill="#000" color="#000" /> Go
            </button>
          </div>
        )}

        {/* ── Snake path grid ── */}
        <div style={{ position: 'relative' }}>
          {Array.from({ length: totalRows }, (_, rowIdx) => {
            const startIdx = rowIdx * ITEMS_PER_ROW;
            const rowLevels = island.levels.slice(startIdx, startIdx + ITEMS_PER_ROW);
            const isReversed = rowIdx % 2 === 1;
            const items = isReversed ? [...rowLevels].reverse() : rowLevels;

            return (
              <div key={rowIdx}>
                {/* Row of nodes */}
                <div style={{
                  display: 'flex',
                  justifyContent: rowLevels.length < ITEMS_PER_ROW ? (isReversed ? 'flex-end' : 'flex-start') : 'space-between',
                  alignItems: 'center',
                  padding: '20px 10px',
                  gap: 8,
                  position: 'relative',
                }}>
                  {/* SVG path connecting nodes in this row */}
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                    {items.map((_, i) => {
                      if (i === items.length - 1) return null;
                      const actualIdx = isReversed ? startIdx + (rowLevels.length - 1 - i) : startIdx + i;
                      const done = isLevelCompleted(progress, island.id, island.levels[actualIdx]?.id);
                      const x1 = `${(i / (items.length - 1 || 1)) * 80 + 10}%`;
                      const x2 = `${((i + 1) / (items.length - 1 || 1)) * 80 + 10}%`;
                      return (
                        <line key={i} x1={x1} y1="50%" x2={x2} y2="50%"
                          stroke={done ? '#34d399' : 'rgba(255,255,255,0.1)'}
                          strokeWidth="3" strokeDasharray={done ? 'none' : '6 4'}
                          strokeLinecap="round" opacity={done ? 0.5 : 0.4}
                        />
                      );
                    })}
                  </svg>

                  {items.map((level, i) => {
                    const actualIdx = isReversed ? startIdx + (rowLevels.length - 1 - i) : startIdx + i;
                    const completed = isLevelCompleted(progress, island.id, level.id);
                    const lvlUnlocked = actualIdx === 0 || isLevelCompleted(progress, island.id, island.levels[actualIdx - 1]?.id);
                    const isNext = nextPhraseLevel?.id === level.id;
                    const boss = isBossLevel(actualIdx, island.levels.length);

                    return (
                      <div key={level.id} ref={isNext ? nextLevelRef : null} style={{ position: 'relative', zIndex: 1 }}>
                        <LevelNode
                          level={level}
                          index={actualIdx}
                          completed={completed}
                          levelUnlocked={lvlUnlocked}
                          isBoss={boss}
                          bossInfo={bossInfo}
                          isCurrentNext={isNext}
                          totalLevels={island.levels.length}
                          onClick={() => launchLevel(level.id)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Vertical connector between rows */}
                {rowIdx < totalRows - 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: isReversed ? 'flex-start' : 'flex-end',
                    padding: '0 30px',
                  }}>
                    <svg width="30" height="36" viewBox="0 0 30 36">
                      <path d="M 15 0 C 5 10, 25 20, 15 36"
                        fill="none"
                        stroke={isLevelCompleted(progress, island.id, island.levels[startIdx + rowLevels.length - 1]?.id) ? '#34d399' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="3" strokeDasharray="6 4"
                        strokeLinecap="round" opacity="0.5"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating continue button */}
      {nextPhraseLevel && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30,
        }}>
          <button onClick={() => launchLevel(nextPhraseLevel.id)}
            style={{
              border: 'none', borderRadius: 50, padding: '14px 28px', cursor: 'pointer',
              fontWeight: 900, fontSize: 14,
              background: isBossLevel(island.levels.indexOf(nextPhraseLevel), island.levels.length)
                ? 'linear-gradient(135deg, #ef4444, #fbbf24)'
                : 'linear-gradient(135deg, #34d399, #22d3ee)',
              color: '#000', fontFamily: "'Nunito',sans-serif",
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'float-btn 3s ease-in-out infinite',
            }}>
            {isBossLevel(island.levels.indexOf(nextPhraseLevel), island.levels.length) ? (
              <><Flame size={16} /> Boss: {nextPhraseLevel.label}</>
            ) : (
              <><Play size={14} fill="#000" color="#000" /> Continue Level {nextPhraseLevel.order}</>
            )}
          </button>
        </div>
      )}

      <style>{`
        @keyframes node-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes boss-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes float-btn {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
