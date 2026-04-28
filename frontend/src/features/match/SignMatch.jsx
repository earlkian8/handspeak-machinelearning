import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, RotateCcw, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { fetchJson } from '../../lib/api';
import { normalizeWordEntry } from '../../lib/vocabulary';
import { getVideoUrl } from '../../components/TutorialModal';
import FeatureIntroModal, { isIntroSeen } from '../../components/FeatureIntroModal';

const PAIRS = 6;
const FLIP_BACK_DELAY = 1000;

const BLOB_BASE = import.meta.env.VITE_BLOB_BASE_URL || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';

function seededShuffle(arr, seed) {
  let s = seed;
  const rand = () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(words) {
  const seed = Date.now();
  const shuffled = seededShuffle(words, seed);
  const chosen = shuffled.slice(0, PAIRS);
  const cards = [];
  chosen.forEach(word => {
    cards.push({ id: `word-${word.id}`, pairId: word.id, type: 'word', word });
    cards.push({ id: `sign-${word.id}`, pairId: word.id, type: 'sign', word });
  });
  return seededShuffle(cards, seed + 1);
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

const MATCH_STEPS = [
  { label: 'Flip',   text: 'Tap any card to flip it — word cards show English, sign cards show the ASL video.' },
  { label: 'Match',  text: 'Find the word card that matches its sign card. Both stay flipped when you match!' },
  { label: 'Clear',  text: 'Match all 6 pairs to complete the board. Try to beat your best time.' },
];

export default function SignMatch() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showIntro, setShowIntro] = useState(() => !isIntroSeen('match'));
  const timerRef = useRef(null);
  const flipBackRef = useRef(null);

  useEffect(() => {
    fetchJson('/api/gesture/words')
      .then(data => {
        const normalized = data.map((e, i) => normalizeWordEntry(e, i));
        setWords(normalized);
        setDeck(buildDeck(normalized));
      })
      .finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (!startTime || done) return;
    timerRef.current = window.setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => window.clearInterval(timerRef.current);
  }, [startTime, done]);

  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    window.clearTimeout(flipBackRef.current);
  }, []);

  const handleFlip = useCallback((card) => {
    if (checking || matched.has(card.pairId) || flipped.has(card.id)) return;

    if (!startTime) setStartTime(Date.now());

    const newFlipped = new Set(flipped);
    newFlipped.add(card.id);
    setFlipped(newFlipped);

    const flippedCards = [...newFlipped];
    if (flippedCards.length < 2) return;

    setChecking(true);

    // Find the two flipped cards
    const [idA, idB] = flippedCards;
    const cardA = deck.find(c => c.id === idA);
    const cardB = deck.find(c => c.id === idB);

    if (cardA.pairId === cardB.pairId) {
      // Match!
      const newMatched = new Set(matched);
      newMatched.add(cardA.pairId);
      setMatched(newMatched);
      setFlipped(new Set());
      setChecking(false);
      if (newMatched.size === PAIRS) {
        const t = Date.now() - startTime;
        setFinalTime(t);
        setDone(true);
        window.clearInterval(timerRef.current);
      }
    } else {
      setMistakes(m => m + 1);
      flipBackRef.current = window.setTimeout(() => {
        setFlipped(new Set());
        setChecking(false);
      }, FLIP_BACK_DELAY);
    }
  }, [checking, matched, flipped, deck, startTime]);

  const restart = () => {
    setDeck(buildDeck(words));
    setFlipped(new Set());
    setMatched(new Set());
    setChecking(false);
    setStartTime(null);
    setElapsed(0);
    setDone(false);
    setFinalTime(0);
    setMistakes(0);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#020a1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #818cf8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (done) {
    return <EndScreen time={finalTime} mistakes={mistakes} onAgain={restart} onExit={() => navigate('/dashboard')} />;
  }

  const progressPct = (matched.size / PAIRS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% -10%, #3730a3 0%, #1e1b4b 40%, #0a0a1e 100%)', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {showIntro && (
        <FeatureIntroModal
          featureKey="match"
          title="Sign Match"
          subtitle="Pair English words with their ASL signs"
          Icon={Layers}
          accentColor="#818cf8"
          steps={MATCH_STEPS}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={() => navigate('/dashboard')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="#818cf8" />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Sign Match</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', maxWidth: 180, margin: '0 auto' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${progressPct}%`, background: 'linear-gradient(90deg,#818cf8,#c084fc)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 99, padding: '4px 10px', flexShrink: 0 }}>
          <Clock size={11} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#c7d2fe' }}>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
          <CheckCircle2 size={13} color="#818cf8" />
          <span><span style={{ color: '#a5b4fc', fontWeight: 900 }}>{matched.size}</span> / {PAIRS} matched</span>
        </div>
        {mistakes > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: '#fca5a5', fontWeight: 900 }}>{mistakes}</span> miss{mistakes !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* Card grid */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 580 }}>
          {deck.map(card => (
            <MatchCard
              key={card.id}
              card={card}
              isFlipped={flipped.has(card.id) || matched.has(card.pairId)}
              isMatched={matched.has(card.pairId)}
              onClick={() => handleFlip(card)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowIntro(true)}
        title="How to play Sign Match"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, width: 36, height: 36, borderRadius: '50%', background: 'rgba(129,140,248,0.15)', border: '1.5px solid rgba(129,140,248,0.4)', color: '#818cf8', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", boxShadow: '0 2px 12px rgba(0,0,0,0.4)', transition: 'background 0.15s ease, transform 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.28)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >?</button>

      <style>{`
        @keyframes card-flip-in {
          from { transform: rotateY(90deg); opacity: 0.4; }
          to   { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes matched-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(129,140,248,0.6); }
          70%  { box-shadow: 0 0 0 12px rgba(129,140,248,0); }
          100% { box-shadow: 0 0 0 0 rgba(129,140,248,0); }
        }
      `}</style>
    </div>
  );
}

function MatchCard({ card, isFlipped, isMatched, onClick }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isFlipped && card.type === 'sign' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isFlipped, card.type]);

  const videoUrl = getVideoUrl(card.word.word || card.word.label);

  return (
    <div
      onClick={isMatched ? undefined : onClick}
      style={{
        aspectRatio: '3/4',
        borderRadius: 18,
        cursor: isMatched ? 'default' : 'pointer',
        position: 'relative',
        animation: isMatched ? 'matched-pulse 0.5s ease' : undefined,
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => { if (!isMatched) e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
    >
      {/* Back face */}
      {!isFlipped && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: 'linear-gradient(135deg, #312e81, #1e1b4b)',
          border: '1.5px solid rgba(129,140,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(129,140,248,0.2)', border: '1.5px solid rgba(129,140,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, color: '#818cf8' }}>?</span>
          </div>
        </div>
      )}

      {/* Front face */}
      {isFlipped && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: isMatched
            ? 'linear-gradient(135deg, rgba(129,140,248,0.3), rgba(139,92,246,0.2))'
            : card.type === 'word' ? 'linear-gradient(135deg, #1e1b4b, #2e1065)' : 'rgba(0,0,0,0.6)',
          border: `1.5px solid ${isMatched ? 'rgba(129,140,248,0.7)' : 'rgba(129,140,248,0.4)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: isMatched ? '0 6px 24px rgba(129,140,248,0.35)' : '0 6px 24px rgba(0,0,0,0.5)',
          animation: 'card-flip-in 0.25s ease',
        }}>
          {card.type === 'word' ? (
            <div style={{ padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: isMatched ? '#a5b4fc' : 'rgba(255,255,255,0.4)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Word</div>
              <div style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', fontWeight: 900, color: isMatched ? '#e0e7ff' : 'white', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {card.word.label || card.word.word}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: isMatched ? '#a5b4fc' : 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', padding: '6px 4px 0' }}>Sign</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
                <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>No video</span>
                </div>
              </div>
            </div>
          )}
          {isMatched && (
            <div style={{ position: 'absolute', top: 6, right: 6 }}>
              <CheckCircle2 size={16} color="#818cf8" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EndScreen({ time, mistakes, onAgain, onExit }) {
  const perfect = mistakes === 0;
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% -10%, #3730a3 0%, #1e1b4b 40%, #0a0a1e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(129,140,248,0.35)', borderRadius: 28, padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(129,140,248,0.18)', border: '2px solid rgba(129,140,248,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trophy size={38} color="#818cf8" />
        </div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#a5b4fc', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Board Cleared!</div>
        <h1 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 900, color: 'white' }}>
          {perfect ? 'Perfect Memory!' : 'Nice work!'}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 16, padding: '14px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#a5b4fc', lineHeight: 1 }}>{formatTime(time)}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>Time</div>
          </div>
          <div style={{ background: mistakes === 0 ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.1)', border: `1px solid ${mistakes === 0 ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 16, padding: '14px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: mistakes === 0 ? '#34d399' : '#fca5a5', lineHeight: 1 }}>{mistakes}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>Misses</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onAgain} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '13px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Nunito',sans-serif" }}>
            <RotateCcw size={14} /> Play Again
          </button>
          <button onClick={onExit} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '13px', cursor: 'pointer', background: 'linear-gradient(135deg,#818cf8,#7c3aed)', color: 'white', fontWeight: 900, fontFamily: "'Nunito',sans-serif" }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
