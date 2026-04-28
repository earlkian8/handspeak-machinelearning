import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import YouTubeTutorial from '../../components/YouTubeTutorial';
import TipBox from '../../components/TipBox';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Circle, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Zap, Target } from 'lucide-react';
import Camera from '../../components/Camera';
import GestureProcessingModal from '../../components/GestureProcessingModal';
import { fetchJson, postJson } from '../../lib/api';
import { findWordIndex, getNextWord, getPreviousWord, normalizeWordEntry } from '../../lib/vocabulary';

const CAPTURE_INTERVAL_MS = 250;
const REQUIRED_STREAK = 2;
const MIN_FRAMES_FOR_VERIFY = 8;
const FRAME_BUFFER_SIZE = 20;
const DEFAULT_THRESHOLD = 0.48;
const COUNTDOWN_SECONDS = 3;

/* Dynamic font for the big word */
function wordFontSize(len) {
  if (len <= 3) return 72;
  if (len <= 5) return 60;
  if (len <= 7) return 48;
  if (len <= 10) return 38;
  return 30;
}

export default function WordPracticeSession() {
  const { wordId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingPhase, setProcessingPhase] = useState('waiting');
  const [processingMessage, setProcessingMessage] = useState('');
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [status, setStatus] = useState('Ready to verify');
  const [matchStreak, setMatchStreak] = useState(0);
  const [latestResult, setLatestResult] = useState(null);
  const webcamRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const frameBufferRef = useRef([]);
  const processingTimersRef = useRef([]);

  const takeFrame = useCallback(() => {
    if (!webcamRef.current) return null;
    return webcamRef.current.captureFrame?.() || webcamRef.current.getScreenshot?.() || null;
  }, []);

  useEffect(() => {
    let active = true;
    fetchJson('/api/gesture/words')
      .then((data) => { if (active) setWords(data.map((entry, index) => normalizeWordEntry(entry, index))); })
      .catch((e) => { if (active) setStatus(e.message || 'Unable to load vocabulary'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!words.length) return;
    const index = findWordIndex(words, wordId);
    setCurrentWord(index >= 0 ? words[index] : words[0]);
  }, [words, wordId]);

  const currentIndex = useMemo(() => findWordIndex(words, currentWord?.id || wordId), [words, currentWord, wordId]);
  const nextWord = useMemo(() => getNextWord(words, currentWord?.id || wordId), [words, currentWord, wordId]);
  const previousWord = useMemo(() => getPreviousWord(words, currentWord?.id || wordId), [words, currentWord, wordId]);

  const advanceToNextWord = useCallback(() => {
    setTimeout(() => {
      if (nextWord) navigate(`/practice/${nextWord.id}`, { replace: true });
      setMatchStreak(0); setLatestResult(null); setReadyToSubmit(false); setIsCountingDown(false); setCountdown(0);
    }, 450);
  }, [nextWord, navigate]);

  const clearProcessingTimers = useCallback(() => {
    processingTimersRef.current.forEach((t) => window.clearTimeout(t));
    processingTimersRef.current = [];
  }, []);

  const startProcessingFeedback = useCallback(() => {
    clearProcessingTimers();
    setShowProcessingModal(true); setProcessingPhase('waiting'); setProcessingMessage('Waiting for your recording package...');
    const t1 = window.setTimeout(() => { setProcessingPhase('reading'); setProcessingMessage('Reading captured frames...'); }, 320);
    const t2 = window.setTimeout(() => { setProcessingPhase('checking'); setProcessingMessage('Checking your gesture...'); }, 760);
    processingTimersRef.current.push(t1, t2);
  }, [clearProcessingTimers]);

  const finishProcessingFeedback = useCallback((ok, msg) => {
    clearProcessingTimers(); setProcessingPhase(ok ? 'success' : 'error'); setProcessingMessage(msg);
    const t = window.setTimeout(() => setShowProcessingModal(false), ok ? 900 : 1500);
    processingTimersRef.current.push(t);
  }, [clearProcessingTimers]);

  useEffect(() => () => clearProcessingTimers(), [clearProcessingTimers]);

  const verifyCurrentFrames = useCallback(async (debugOverrideWord = null) => {
    if (isSubmittingRef.current || !currentWord) return;
    if (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
      setStatus(`Need ${MIN_FRAMES_FOR_VERIFY - frameBufferRef.current.length} more frame(s)`); return;
    }
    isSubmittingRef.current = true; setReadyToSubmit(false); startProcessingFeedback();
    setStatus(`Checking ${currentWord.label}...`);
    try {
      const response = await postJson('/api/gesture/verify/dynamic', {
        target_word: currentWord.word,
        frames: frameBufferRef.current.length ? frameBufferRef.current : ["data:image/jpeg;base64,mock"],
        top_k: 5, threshold: DEFAULT_THRESHOLD,
        ...(debugOverrideWord ? { debug_override_word: debugOverrideWord } : {}),
      });
      setLatestResult(response);
      if (response.is_match) {
        const ns = matchStreak + 1;
        if (ns >= REQUIRED_STREAK) {
          setMatchStreak(0); setStatus(`Match ${REQUIRED_STREAK}/${REQUIRED_STREAK}. Advancing...`);
          finishProcessingFeedback(true, `Correct! Streak ${REQUIRED_STREAK}/${REQUIRED_STREAK}.`); advanceToNextWord();
        } else {
          setMatchStreak(ns); setStatus(`Match ${ns}/${REQUIRED_STREAK}. Record again.`);
          finishProcessingFeedback(true, `Correct! Streak ${ns}/${REQUIRED_STREAK}.`);
        }
      } else {
        const sim = Number(response.similarity ?? 0).toFixed(3);
        const best = String(response.best_match || 'unknown').toUpperCase();
        setMatchStreak(0); setStatus(`Wrong gesture. Closest: ${best} · ${sim}`);
        finishProcessingFeedback(false, `Wrong gesture. Closest: ${best} · ${sim}`);
      }
    } catch (e) {
      setStatus(e.message || 'Verification failed'); setMatchStreak(0); setReadyToSubmit(true);
      finishProcessingFeedback(false, e.message || 'Could not submit.');
    } finally { isSubmittingRef.current = false; }
  }, [advanceToNextWord, currentWord, finishProcessingFeedback, matchStreak, startProcessingFeedback]);

  const handleRecordToggle = useCallback(() => {
    if (isSubmittingRef.current || isCountingDown) return;
    if (!recording) {
      frameBufferRef.current = []; setLatestResult(null); setReadyToSubmit(false);
      setCountdown(COUNTDOWN_SECONDS); setIsCountingDown(true); setStatus(`Get ready... ${COUNTDOWN_SECONDS}`);
      return;
    }
    setRecording(false);
    const f = takeFrame(); if (f) frameBufferRef.current = [...frameBufferRef.current, f].slice(-FRAME_BUFFER_SIZE);
    if (frameBufferRef.current.length > 0 && frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
      const pad = frameBufferRef.current[frameBufferRef.current.length - 1];
      while (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) frameBufferRef.current.push(pad);
    }
    if (!frameBufferRef.current.length) { setReadyToSubmit(false); setStatus('No frames captured. Try again.'); return; }
    setReadyToSubmit(true); setStatus('Recording stopped. Press submit to verify.');
  }, [isCountingDown, recording, takeFrame]);

  useEffect(() => {
    if (!isCountingDown) return;
    if (countdown <= 0) { setIsCountingDown(false); setRecording(true); setStatus('Recording... hold the sign steady'); return; }
    const t = window.setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown, isCountingDown]);

  const goTo = useCallback((idx) => {
    if (!words.length) return;
    const target = words[Math.max(0, Math.min(words.length - 1, idx))];
    navigate(`/practice/${target.id}`, { replace: true });
    setRecording(false); setReadyToSubmit(false); setIsCountingDown(false); setCountdown(0);
    setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify');
  }, [words, navigate]);

  useEffect(() => {
    if (!recording || !currentWord || !words.length) return;
    const id = window.setInterval(() => {
      if (isSubmittingRef.current || !webcamRef.current) return;
      const s = takeFrame(); if (!s) return;
      frameBufferRef.current = [...frameBufferRef.current, s].slice(-FRAME_BUFFER_SIZE);
      if (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) setStatus(`Collecting frames ${frameBufferRef.current.length}/${MIN_FRAMES_FOR_VERIFY}...`);
      else setStatus(`Frames ready. Tap stop when done.`);
    }, CAPTURE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [recording, currentWord, words.length, takeFrame]);

  useEffect(() => {
    frameBufferRef.current = []; setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify');
    setReadyToSubmit(false); setIsCountingDown(false); setCountdown(0); clearProcessingTimers(); setShowProcessingModal(false);
  }, [clearProcessingTimers, currentWord?.id]);

  const resetSession = () => {
    setRecording(false); setReadyToSubmit(false); setIsCountingDown(false); setCountdown(0);
    frameBufferRef.current = []; setMatchStreak(0); setLatestResult(null); setStatus('Ready to verify');
  };

  if (!currentWord) {
    return (<div style={{ minHeight: '100vh', background: '#020a1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>);
  }

  const streakPct = (matchStreak / REQUIRED_STREAK) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,22,0.92)', backdropFilter: 'blur(14px)', fontFamily: "'Nunito', sans-serif" }}>
      <div className="wps-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1140, maxHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(103,232,249,0.1)', animation: 'wps-enter 0.35s ease-out' }}>

        {/* ─── Top bar ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="#67e8f9" />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Word Practice</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{currentIndex + 1} / {words.length}</span>
            {/* Streak bar */}
            <div style={{ width: 100, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${streakPct}%`, borderRadius: 99, background: 'linear-gradient(90deg, #34d399, #22d3ee)', transition: 'width 0.35s ease', boxShadow: streakPct > 0 ? '0 0 8px rgba(52,211,153,0.5)' : 'none' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: matchStreak > 0 ? '#34d399' : 'rgba(255,255,255,0.3)' }}>{matchStreak}/{REQUIRED_STREAK}</span>
          </div>
          <button onClick={() => navigate('/practice')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            <X size={16} color="white" />
          </button>
        </div>

        {/* ─── Main content ─── */}
        <div className="wps-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Camera */}
          <div style={{ flex: 1, position: 'relative', background: '#040c18', minHeight: 420 }}>
            <Camera ref={webcamRef} />

            {/* Debug controls */}
            {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG === 'true' && (
              <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => verifyCurrentFrames(currentWord.word)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}>Test: Correct</button>
                <button onClick={() => verifyCurrentFrames('wrongword')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}>Test: Wrong</button>
              </div>
            )}

            {/* Status badge */}
            <div style={{ position: 'absolute', top: 14, left: 14, background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: recording ? 'white' : '#ef4444', animation: recording ? 'wps-blink 1s ease-in-out infinite' : undefined }} />
              <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {isCountingDown ? `Starting ${countdown}` : recording ? 'Recording' : readyToSubmit ? 'Ready' : 'Camera'}
              </span>
            </div>

            {/* Countdown overlay */}
            {isCountingDown && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(2,10,28,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid rgba(103,232,249,0.4)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67e8f9', fontSize: 44, fontWeight: 900, animation: 'wps-pulse 0.6s ease-out' }}>{countdown}</div>
              </div>
            )}

            {/* Controls bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, background: 'linear-gradient(0deg, rgba(4,12,24,0.85) 0%, transparent 100%)' }}>
              <button onClick={() => previousWord && goTo(currentIndex - 1)} disabled={!previousWord} style={{ width: 40, height: 40, borderRadius: '50%', background: !previousWord ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !previousWord ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !previousWord ? 0.35 : 1, transition: 'all 0.2s' }}>
                <ChevronLeft size={18} color="white" />
              </button>

              <button onClick={handleRecordToggle} disabled={isCountingDown} style={{ width: 68, height: 68, borderRadius: '50%', border: `4px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.8)'}`, background: recording ? '#ef4444' : 'white', cursor: isCountingDown ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: recording ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', opacity: isCountingDown ? 0.5 : 1 }}>
                <Circle size={26} fill={recording ? 'white' : '#e63946'} color={recording ? 'white' : '#e63946'} />
              </button>

              {readyToSubmit && (
                <button onClick={() => verifyCurrentFrames()} disabled={isSubmittingRef.current || isCountingDown} style={{ border: 'none', borderRadius: 99, padding: '10px 20px', cursor: 'pointer', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 12, boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}>
                  <Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Submit
                </button>
              )}

              <button onClick={() => nextWord && goTo(currentIndex + 1)} disabled={!nextWord} style={{ width: 40, height: 40, borderRadius: '50%', background: !nextWord ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: !nextWord ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !nextWord ? 0.35 : 1, transition: 'all 0.2s' }}>
                <ChevronRight size={18} color="white" />
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="wps-panel" style={{ width: 380, flexShrink: 0, background: 'linear-gradient(180deg,#0e2347 0%,#091832 100%)', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px', gap: 12, overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Word display card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(34,211,238,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: wordFontSize(currentWord.label.length), fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word', overflowWrap: 'anywhere', background: 'linear-gradient(135deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {currentWord.label}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{currentWord.description}</p>
            </div>

            {/* Tutorial */}
            <YouTubeTutorial word={currentWord.label} isLetter={false} />

            {/* Tip */}
            <TipBox tip={currentWord.tip} />

            {/* Model result */}
            <div style={{ borderRadius: 14, background: latestResult ? (latestResult.is_match ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.04)', border: `1px solid ${latestResult ? (latestResult.is_match ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'rgba(255,255,255,0.08)'}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>Status</span>
                {latestResult?.is_match && <CheckCircle2 size={14} color="#4ade80" />}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: latestResult ? (latestResult.is_match ? '#bbf7d0' : '#fecaca') : 'white', fontWeight: 800 }}>{status}</p>
              {latestResult && (
                <p style={{ margin: 0, fontSize: 11, color: latestResult.is_match ? 'rgba(187,247,208,0.8)' : 'rgba(254,202,202,0.8)' }}>
                  Best: {String(latestResult.best_match || '?').toUpperCase()} · Sim: {Number(latestResult.similarity ?? 0).toFixed(3)}
                </p>
              )}
            </div>

            {/* Nav dots */}
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
              {words.map((w, i) => (
                <button key={w.id} onClick={() => goTo(i)} style={{ width: i === currentIndex ? 18 : 6, height: 6, borderRadius: 99, background: i === currentIndex ? 'linear-gradient(90deg,#34d399,#22d3ee)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, boxShadow: i === currentIndex ? '0 0 6px rgba(52,211,153,0.6)' : 'none', transition: 'all 0.2s', flexShrink: 0 }} />
              ))}
            </div>

            {/* Reset */}
            <button onClick={resetSession} style={{ border: 'none', borderRadius: 12, padding: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      <GestureProcessingModal open={showProcessingModal} phase={processingPhase} message={processingMessage} onClose={() => setShowProcessingModal(false)} />

      <style>{`
        @keyframes wps-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes wps-enter { 0%{opacity:0;transform:scale(0.94) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes wps-pulse { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @media (max-width: 768px) {
          .wps-body { flex-direction: column !important; }
          .wps-panel { width: 100% !important; max-height: 50vh; }
        }
      `}</style>
    </div>
  );
}