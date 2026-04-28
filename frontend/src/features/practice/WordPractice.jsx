import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hand, RefreshCw, Search, X, MousePointerClick, Camera, Zap } from 'lucide-react';
import { fetchJson } from '../../lib/api';
import { normalizeWordEntry } from '../../lib/vocabulary';
import FeatureIntroModal, { isIntroSeen } from '../../components/FeatureIntroModal';

const ASL_IMG_BASE = 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs';
const ALPHABET_LETTERS = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('');

function LetterCard({ letter, onClick, accent }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button
      onClick={() => onClick(letter)}
      style={{
        width: 96,
        borderRadius: 20,
        border: '2px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        padding: '10px 8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
        transition: 'transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s ease, border-color 0.18s ease',
        fontFamily: "'Nunito',sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.04)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.38)';
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
      }}
    >
      <div style={{
        width: 64, height: 64,
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(255,255,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {imgOk ? (
          <img
            src={`${ASL_IMG_BASE}/${letter.toLowerCase()}.gif`}
            alt={`ASL ${letter}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setImgOk(false)}
          />
        ) : (
          <span style={{ fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1 }}>{letter}</span>
        )}
      </div>
      <span style={{ fontSize: 16, fontWeight: 900, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
        {letter}
      </span>
    </button>
  );
}

function WordCard({ word, onClick, accent, query }) {
  // Highlight matching part of label
  const label = word.label;
  const q = query.trim().toLowerCase();
  let content;
  if (q && label.toLowerCase().includes(q)) {
    const idx = label.toLowerCase().indexOf(q);
    content = (
      <>
        {label.slice(0, idx)}
        <mark style={{ background: 'rgba(251,191,36,0.55)', color: 'inherit', borderRadius: 3 }}>
          {label.slice(idx, idx + q.length)}
        </mark>
        {label.slice(idx + q.length)}
      </>
    );
  } else {
    content = label;
  }

  return (
    <button
      onClick={() => onClick(word)}
      style={{
        width: 160,
        borderRadius: 20,
        border: '2px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        padding: '14px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
        transition: 'transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s ease, border-color 0.18s ease',
        fontFamily: "'Nunito',sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.04)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.38)';
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
      }}
    >
      <div style={{
        width: 88, height: 88, borderRadius: 18,
        background: 'rgba(255,255,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: 17, fontWeight: 900,
        textAlign: 'center', lineHeight: 1.1, padding: '0 8px',
      }}>
        {word.label}
      </div>
      <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.16em' }}>
        {word.chapter_id}
      </span>
      <span style={{ fontSize: 14, fontWeight: 900, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
        {content}
      </span>
    </button>
  );
}

export default function WordPractice() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('words');
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchJson('/api/gesture/words')
      .then((data) => {
        if (!active) return;
        setWords(data.map((entry, index) => normalizeWordEntry(entry, index)));
        setError('');
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || 'Failed to load vocabulary');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredWords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter((w) => w.label.toLowerCase().includes(q));
  }, [words, query]);

  const accentColor = '#6ee7b7';
  const [showIntro, setShowIntro] = useState(() => !isIntroSeen('drill'));

  const DRILL_STEPS = [
    { Icon: MousePointerClick, label: 'Pick',    text: 'Choose any word from the list or select a letter from the alphabet.' },
    { Icon: Camera,            label: 'Sign',    text: 'Face the camera and perform the ASL sign when ready.' },
    { Icon: Zap,               label: 'Repeat',  text: 'Get instant feedback and drill as many signs as you like.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Nunito', sans-serif",
      background: 'radial-gradient(ellipse at 18% 0%,#fb923c 0%,#ea580c 20%,#9a3412 50%,#431407 100%)',
      position: 'relative', overflow: 'hidden',
    }}>

      {showIntro && (
        <FeatureIntroModal
          featureKey="drill"
          title="Drill"
          subtitle="Free-form practice — words & alphabet"
          Icon={Hand}
          accentColor="#fb923c"
          steps={DRILL_STEPS}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '18px 32px',
        background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        position: 'sticky', top: 0, zIndex: 20,
        flexWrap: 'wrap', rowGap: 12,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: 46, height: 46, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.24)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ArrowLeft size={20} color="white" />
        </button>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
            {activeTab === 'words' ? 'Word Practice' : 'Alphabet Practice'}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>
            {activeTab === 'words' ? 'Tap a word to open the camera challenge' : 'Tap a letter to open the camera challenge'}
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 99, padding: 4, flexShrink: 0 }}>
          {['words', 'alphabet'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                border: 'none',
                borderRadius: 99,
                padding: '6px 16px',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 12,
                fontFamily: "'Nunito', sans-serif",
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#9a3412' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Search bar (words only) ── */}
        {activeTab === 'words' && <div style={{
          flex: 1, minWidth: 200, maxWidth: 380,
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.14)',
          border: '1.5px solid rgba(255,255,255,0.28)',
          borderRadius: 99,
          padding: '8px 14px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(110,231,183,0.7)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(110,231,183,0.18), 0 4px 20px rgba(0,0,0,0.2)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
          }}
        >
          <Search size={16} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words… e.g. TV, happy, dog"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'white',
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              style={{
                border: 'none', background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, padding: 0,
              }}
            >
              <X size={11} color="white" />
            </button>
          )}
        </div>}

        {/* Count badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
          borderRadius: 99, padding: '7px 16px', flexShrink: 0,
        }}>
          <Hand size={14} color="rgba(255,255,255,0.8)" />
          <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.9)' }}>
            {activeTab === 'alphabet'
              ? `${ALPHABET_LETTERS.length} letters`
              : query ? `${filteredWords.length} / ${words.length}` : `${words.length || '--'} words`}
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: '32px 36px 64px', position: 'relative', zIndex: 2 }}>

        {/* ── Alphabet tab ── */}
        {activeTab === 'alphabet' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25))' }} />
              <h2 style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.24em', margin: 0, whiteSpace: 'nowrap' }}>
                Alphabet · A – Z
              </h2>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.25), transparent)' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
              {ALPHABET_LETTERS.map((letter) => (
                <LetterCard
                  key={letter}
                  letter={letter}
                  onClick={(l) => navigate(`/practice/alphabet/${l.toLowerCase()}`)}
                  accent="#fb923c"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Words tab ── */}
        {activeTab === 'words' && (loading ? (
          <div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>
            Loading vocabulary...
          </div>
        ) : error ? (
          <div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fecaca', fontWeight: 900, textAlign: 'center' }}>
            <div>
              <p style={{ margin: '0 0 12px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ border: 'none', borderRadius: 14, padding: '12px 18px', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </div>
        ) : (
          <section>
            {/* Result divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25))' }} />
              <h2 style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.24em', margin: 0, whiteSpace: 'nowrap' }}>
                {query
                  ? filteredWords.length > 0
                    ? `${filteredWords.length} result${filteredWords.length !== 1 ? 's' : ''} for "${query}"`
                    : `No results for "${query}"`
                  : `${words.length} Words`}
              </h2>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.25), transparent)' }} />
            </div>

            {/* Empty state */}
            {filteredWords.length === 0 && query ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 220, gap: 14,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Search size={28} color="rgba(255,255,255,0.5)" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  No word found for "{query}"
                </p>
                <button
                  onClick={() => setQuery('')}
                  style={{ border: 'none', borderRadius: 99, padding: '9px 22px', cursor: 'pointer', background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 900, fontSize: 13 }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                {filteredWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onClick={(target) => navigate(`/practice/${target.id}`)}
                    accent={accentColor}
                    query={query}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.45); }
      `}</style>
    </div>
  );
}