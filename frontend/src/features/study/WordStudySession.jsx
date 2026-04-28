import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Circle, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, BookOpen } from 'lucide-react';
import Camera from '../../components/Camera';
import YouTubeTutorial from '../../components/YouTubeTutorial';
import TipBox from '../../components/TipBox';
import { fetchJson, postJson } from '../../lib/api';
import { findWordIndex, getNextWord, getPreviousWord, normalizeWordEntry } from '../../lib/vocabulary';
import { getStoredStudyProgress, loadStudyProgress, saveStudyProgress } from './studyVoyage';

const CAPTURE_INTERVAL_MS = 350;
const REQUIRED_STREAK = 3;
const DEFAULT_THRESHOLD = 0.72;

function wordFontSize(len) {
  if (len <= 3) return 72;
  if (len <= 5) return 60;
  if (len <= 7) return 48;
  if (len <= 10) return 38;
  return 30;
}

export default function WordStudySession() {
  const { chapterId, wordId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [completedWords, setCompletedWords] = useState(() => getStoredStudyProgress().completed_phrases || []);
  const [status, setStatus] = useState('Ready to verify');
  const [latestResult, setLatestResult] = useState(null);
  const [matchStreak, setMatchStreak] = useState(0);
  const webcamRef = useRef(null);
  const frameBufferRef = useRef([]);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadStudyProgress().then((p) => { if (active) setCompletedWords(p.completed_phrases || []); });
    fetchJson('/api/gesture/words')
      .then((data) => { if (active) setWords(data.map((e, i) => normalizeWordEntry(e, i))); })
      .catch((e) => { if (active) setStatus(e.message || 'Unable to load study words'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!words.length) return;
    const idx = findWordIndex(words, wordId);
    setCurrentWord(idx >= 0 ? words[idx] : words[0]);
  }, [words, wordId]);

  const currentIndex = useMemo(() => findWordIndex(words, currentWord?.id || wordId), [words, currentWord, wordId]);
  const nextWord = useMemo(() => getNextWord(words, currentWord?.id || wordId), [words, currentWord, wordId]);
  const previousWord = useMemo(() => getPreviousWord(words, currentWord?.id || wordId), [words, currentWord, wordId]);

  const goTo = useCallback((idx) => {
    if (!words.length) return;
    const target = words[Math.max(0, Math.min(words.length - 1, idx))];
    navigate(`/study/${chapterId}/${target.id}`, { replace: true });
    setRecording(false); setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify');
  }, [words, navigate, chapterId]);

  useEffect(() => {
    if (!recording || !currentWord || !words.length) return;
    const id = window.setInterval(async () => {
      if (isSubmittingRef.current || !webcamRef.current) return;
      const s = webcamRef.current.getScreenshot?.();
      if (!s) return;
      frameBufferRef.current = [...frameBufferRef.current, s].slice(-5);
      if (frameBufferRef.current.length < 5) { setStatus('Collecting frames...'); return; }
      isSubmittingRef.current = true;
      setStatus(`Checking ${currentWord.label}...`);
      try {
        const resp = await postJson('/api/gesture/verify/dynamic', { target_word: currentWord.word, frames: frameBufferRef.current, top_k: 5, threshold: DEFAULT_THRESHOLD });
        setLatestResult(resp);
        if (resp.is_match) {
          setMatchStreak((v) => {
            const nv = v + 1;
            setStatus(`Match ${nv}/${REQUIRED_STREAK}`);
            if (nv >= REQUIRED_STREAK) {
              setTimeout(() => {
                setMatchStreak(0); setLatestResult(null);
                setCompletedWords((cur) => {
                  const next = cur.includes(currentWord.id) ? cur : [...cur, currentWord.id];
                  saveStudyProgress({ ...getStoredStudyProgress(), completed_phrases: next });
                  return next;
                });
                if (nextWord) navigate(`/study/${chapterId}/${nextWord.id}`, { replace: true }); else navigate('/study');
              }, 450);
              return 0;
            }
            return nv;
          });
        } else { setMatchStreak(0); setStatus(`Closest: ${resp.best_match}`); }
      } catch (e) { setStatus(e.message || 'Verification failed'); setMatchStreak(0); }
      finally { isSubmittingRef.current = false; }
    }, CAPTURE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [recording, currentWord, nextWord, navigate, chapterId, words.length]);

  useEffect(() => { frameBufferRef.current = []; setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify'); }, [currentWord?.id]);

  if (!currentWord) {
    return (<div style={{ minHeight: '100vh', background: '#020a1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading study word...</div>);
  }

  const streakPct = (matchStreak / REQUIRED_STREAK) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,22,0.92)', backdropFilter: 'blur(14px)', fontFamily: "'Nunito', sans-serif" }}>
      <div className="wss-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1140, maxHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(52,211,153,0.1)', animation: 'wss-enter 0.35s ease-out' }}>

        {/* ─── Top bar ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Study Word</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{currentIndex + 1} / {words.length}</span>
            <div style={{ width: 100, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${streakPct}%`, borderRadius: 99, background: 'linear-gradient(90deg, #34d399, #22d3ee)', transition: 'width 0.35s ease', boxShadow: streakPct > 0 ? '0 0 8px rgba(52,211,153,0.5)' : 'none' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: matchStreak > 0 ? '#34d399' : 'rgba(255,255,255,0.3)' }}>{matchStreak}/{REQUIRED_STREAK}</span>
          </div>
          <button onClick={() => navigate('/study')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} color="white" />
          </button>
        </div>

        {/* ─── Main content ─── */}
        <div className="wss-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Camera */}
          <div style={{ flex: 1, position: 'relative', background: '#040c18', minHeight: 420 }}>
            <Camera ref={webcamRef} />

            {/* Debug controls */}
            {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG === 'true' && (
              <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={async () => {
                  isSubmittingRef.current = true;
                  try {
                    const r = await postJson('/api/gesture/verify/dynamic', { target_word: currentWord.word, frames: ["data:image/jpeg;base64,mock"], top_k: 5, threshold: 0.1, debug_override_word: currentWord.word });
                    setLatestResult(r);
                    if (r.is_match) { setMatchStreak((v) => { const nv = v+1; setStatus(`Match ${nv}/${REQUIRED_STREAK}`); if(nv>=REQUIRED_STREAK){setTimeout(()=>{setMatchStreak(0);setLatestResult(null);setCompletedWords((c)=>{const n=c.includes(currentWord.id)?c:[...c,currentWord.id]; saveStudyProgress({...getStoredStudyProgress(),completed_phrases:n}); return n;}); const idx=words.findIndex(w=>w.id===currentWord.id); if(idx!==-1&&idx<words.length-1)setCurrentWord(words[idx+1]); else navigate('/study');},1000); return nv;} return nv;}); }
                  } finally { isSubmittingRef.current = false; }
                }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}>Test: Correct</button>
                <button onClick={async () => {
                  isSubmittingRef.current = true;
                  try { const r = await postJson('/api/gesture/verify/dynamic', { target_word: currentWord.word, frames: ["data:image/jpeg;base64,mock"], top_k: 5, threshold: 0.1, debug_override_word: 'wrongword' }); setLatestResult(r); setStatus(`Closest: ${r.best_match}`); setMatchStreak(0); } finally { isSubmittingRef.current = false; }
                }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}>Test: Wrong</button>
              </div>
            )}

            <div style={{ position: 'absolute', top: 14, left: 14, background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: recording ? 'white' : '#ef4444', animation: recording ? 'wss-blink 1s ease-in-out infinite' : undefined }} />
              <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{recording ? 'Recording' : 'Camera'}</span>
            </div>

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, background: 'linear-gradient(0deg, rgba(4,12,24,0.85) 0%, transparent 100%)' }}>
              <button onClick={() => previousWord && goTo(currentIndex - 1)} disabled={!previousWord} style={{ width: 40, height: 40, borderRadius: '50%', background: !previousWord ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !previousWord ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !previousWord ? 0.35 : 1 }}>
                <ChevronLeft size={18} color="white" />
              </button>
              <button onClick={() => setRecording(!recording)} style={{ width: 68, height: 68, borderRadius: '50%', border: `4px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.8)'}`, background: recording ? '#ef4444' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: recording ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <Circle size={26} fill={recording ? 'white' : '#e63946'} color={recording ? 'white' : '#e63946'} />
              </button>
              <button onClick={() => nextWord && goTo(currentIndex + 1)} disabled={!nextWord} style={{ width: 40, height: 40, borderRadius: '50%', background: !nextWord ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !nextWord ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !nextWord ? 0.35 : 1 }}>
                <ChevronRight size={18} color="white" />
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="wss-panel" style={{ width: 380, flexShrink: 0, background: 'linear-gradient(180deg,#0e2347 0%,#091832 100%)', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px', gap: 12, overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Word card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(34,211,238,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: wordFontSize(currentWord.label.length), fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word', overflowWrap: 'anywhere', background: 'linear-gradient(135deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {currentWord.label}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{currentWord.description}</p>
            </div>

            <YouTubeTutorial word={currentWord.label} isLetter={false} />
            <TipBox tip={currentWord.tip} />

            {/* Model result */}
            <div style={{ borderRadius: 14, background: latestResult?.is_match ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${latestResult?.is_match ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>Status</span>
                {latestResult?.is_match && <CheckCircle2 size={14} color="#4ade80" />}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'white', fontWeight: 800 }}>{status}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{latestResult ? `Best: ${latestResult.best_match} · Sim: ${latestResult.similarity.toFixed(3)}` : 'Start recording to verify.'}</p>
            </div>

            <button onClick={() => { setRecording(false); frameBufferRef.current = []; setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify'); }} style={{ border: 'none', borderRadius: 12, padding: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wss-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes wss-enter { 0%{opacity:0;transform:scale(0.94) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @media (max-width: 768px) {
          .wss-body { flex-direction: column !important; }
          .wss-panel { width: 100% !important; max-height: 50vh; }
        }
      `}</style>
    </div>
  );
}