import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Circle, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import Camera from '../../components/Camera';
import YouTubeTutorial from '../../components/YouTubeTutorial';
import TipBox from '../../components/TipBox';
import { loadPracticeSigns } from './practiceApi';

const ASL_IMG_BASE = 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs';

export default function PracticeSession() {
  const { type, signId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [alphabet, setAlphabet] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadPracticeSigns()
      .then(({ alphabet: a, numbers: n }) => { if (active) { setAlphabet(a); setNumbers(n); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load practice signs'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const signs = useMemo(() => {
    if (type === 'alphabet') return alphabet;
    if (type === 'number') return numbers;
    return [];
  }, [type, alphabet, numbers]);

  const currentIndex = signs.findIndex((s) => s.id === signId);
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentSign = signs[resolvedIndex] || null;

  const goTo = useCallback((idx) => {
    setImgOk(true);
    const s = signs[Math.max(0, Math.min(signs.length - 1, idx))];
    navigate(`/practice/${type}/${s.id}`, { replace: true });
  }, [signs, type, navigate]);

  const handleClose = useCallback(() => navigate('/practice'), [navigate]);

  const imgSrc = type === 'alphabet' ? `${ASL_IMG_BASE}/${currentSign?.label?.toLowerCase()}.gif` : null;
  const canPrev = resolvedIndex > 0;
  const canNext = resolvedIndex < signs.length - 1;

  if (loading) {
    return (<div style={{ minHeight: '100vh', background: '#020a1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>);
  }
  if (error || !currentSign) {
    return (
      <div style={{ minHeight: '100vh', background: '#020a1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 900, margin: '0 0 12px' }}>{error || 'Sign not found.'}</p>
          <button onClick={handleClose} style={{ border: 'none', borderRadius: 14, padding: '12px 20px', cursor: 'pointer', fontWeight: 900, background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b' }}>Back to Practice</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,22,0.92)', backdropFilter: 'blur(14px)', fontFamily: "'Nunito', sans-serif" }}>
      <div className="ps-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1140, maxHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(103,232,249,0.1)', animation: 'ps-enter 0.35s ease-out' }}>

        {/* ─── Top bar ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="#fb923c" />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              {type === 'alphabet' ? 'Letter Practice' : 'Number Practice'}
            </span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{resolvedIndex + 1} / {signs.length}</span>
          </div>
          <button onClick={handleClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            <X size={16} color="white" />
          </button>
        </div>

        {/* ─── Main content ─── */}
        <div className="ps-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Camera */}
          <div style={{ flex: 1, position: 'relative', background: '#040c18', minHeight: 420 }}>
            <Camera />

            {/* Status badge */}
            <div style={{ position: 'absolute', top: 14, left: 14, background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: recording ? 'white' : '#ef4444', animation: recording ? 'ps-blink 1s ease-in-out infinite' : undefined }} />
              <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{recording ? 'Recording' : 'Camera'}</span>
            </div>

            {/* Controls bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, background: 'linear-gradient(0deg, rgba(4,12,24,0.85) 0%, transparent 100%)' }}>
              <button onClick={() => goTo(resolvedIndex - 1)} disabled={!canPrev} style={{ width: 40, height: 40, borderRadius: '50%', background: !canPrev ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !canPrev ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !canPrev ? 0.35 : 1, transition: 'all 0.2s' }}>
                <ChevronLeft size={18} color="white" />
              </button>

              <button onClick={() => setRecording(!recording)} style={{ width: 68, height: 68, borderRadius: '50%', border: `4px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.8)'}`, background: recording ? '#ef4444' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: recording ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <Circle size={26} fill={recording ? 'white' : '#e63946'} color={recording ? 'white' : '#e63946'} />
              </button>

              <button onClick={() => goTo(resolvedIndex + 1)} disabled={!canNext} style={{ width: 40, height: 40, borderRadius: '50%', background: !canNext ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !canNext ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !canNext ? 0.35 : 1, transition: 'all 0.2s' }}>
                <ChevronRight size={18} color="white" />
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="ps-panel" style={{ width: 380, flexShrink: 0, background: 'linear-gradient(180deg,#0e2347 0%,#091832 100%)', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px', gap: 12, overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Sign display card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(234,88,12,0.06))', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 18, padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg,#fb923c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {currentSign.label}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{currentSign.description}</p>
            </div>

            {/* Tutorial */}
            <YouTubeTutorial word={currentSign.label} isLetter={type === 'alphabet'} />

            {/* ASL hand gesture image */}
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Hand Gesture Reference</p>
              <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                {imgSrc && imgOk ? (
                  <img key={currentSign.id} src={imgSrc} alt={`ASL ${currentSign.label}`} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} onError={() => setImgOk(false)} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>{currentSign.label}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>ASL · {type === 'alphabet' ? 'Letter' : 'Number'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tip */}
            <TipBox tip={currentSign.tip} />

            {/* Nav dots */}
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
              {signs.map((s, i) => (
                <button key={s.id} onClick={() => goTo(i)} style={{ width: i === resolvedIndex ? 18 : 6, height: 6, borderRadius: 99, background: i === resolvedIndex ? 'linear-gradient(90deg,#fb923c,#f97316)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, boxShadow: i === resolvedIndex ? '0 0 6px rgba(251,146,60,0.6)' : 'none', transition: 'all 0.2s', flexShrink: 0 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ps-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes ps-enter { 0%{opacity:0;transform:scale(0.94) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @media (max-width: 768px) {
          .ps-body { flex-direction: column !important; }
          .ps-panel { width: 100% !important; max-height: 50vh; }
        }
      `}</style>
    </div>
  );
}
