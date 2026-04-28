import React, { useState, useEffect, useCallback, useRef } from 'react';
import YouTubeTutorial from '../../components/YouTubeTutorial';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Circle, ArrowRight, CheckCircle, Lock, Waves, Zap, BookOpen, PlayCircle, Hand, Trophy } from 'lucide-react';
import TipBox from '../../components/TipBox';
import Camera from '../../components/Camera';
import GestureProcessingModal from '../../components/GestureProcessingModal';
import FeatureIntroModal, { isIntroSeen } from '../../components/FeatureIntroModal';
import { postJson } from '../../lib/api';
import {
  getInitialStudyProgress,
  getStoredStudyProgress,
  loadStudyProgress,
  saveStudyProgress,
  isIslandUnlocked,
  isLevelCompleted,
  completeIslandLevel,
  isBossLevel,
} from './studyVoyage';
import { useIslands } from '../../contexts/IslandsContext';

const LETTER_CAPTURE_INTERVAL_MS = 450;
const WORD_CAPTURE_INTERVAL_MS = 250;
const REQUIRED_STREAK = 3;
const LETTER_MIN_FRAMES_FOR_VERIFY = 3;
const WORD_MIN_FRAMES_FOR_VERIFY = 8;
const LETTER_FRAME_BUFFER_SIZE = 5;
const WORD_FRAME_BUFFER_SIZE = 20;
const LETTER_THRESHOLD = 0.66;
const WORD_THRESHOLD = 0.48;
const COUNTDOWN_SECONDS = 3;

export default function StudySession() {
  const { islandId, levelId } = useParams();
  const navigate = useNavigate();
  const { getIslandById } = useIslands();
  const [recording, setRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingPhase, setProcessingPhase] = useState('waiting');
  const [processingMessage, setProcessingMessage] = useState('');
  const [progress, setProgress] = useState(getInitialStudyProgress());
  const [showSuccess, setShowSuccess] = useState(false);
  const [status, setStatus] = useState('Ready to verify');
  const [latestResult, setLatestResult] = useState(null);
  const [matchStreak, setMatchStreak] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [levelStreak, setLevelStreak] = useState(() => {
    try { return parseInt(sessionStorage.getItem('ss_level_streak') || '0', 10); } catch { return 0; }
  });
  const levelStreakRef = useRef(levelStreak);
  const [showIntro, setShowIntro] = useState(() => !isIntroSeen('level'));
  const webcamRef = useRef(null);
  const frameBufferRef = useRef([]);
  const isSubmittingRef = useRef(false);
  const processingTimersRef = useRef([]);

  const takeFrame = useCallback(() => {
    if (!webcamRef.current) return null;
    return webcamRef.current.captureFrame?.() || webcamRef.current.getScreenshot?.() || null;
  }, []);

  const island = getIslandById(islandId);
  const phraseLevel = island?.levels.find((level) => level.id === levelId) || null;
  const activeLevel = phraseLevel;
  const phraseIndex = island?.levels.findIndex((level) => level.id === levelId) ?? -1;
  const isBoss = island ? isBossLevel(phraseIndex, island.levels.length) : false;
  const bossInfo = island?.boss || null;
  const [showBossIntro, setShowBossIntro] = useState(false);

  // Boss intro overlay
  useEffect(() => {
    if (isBoss && activeLevel) {
      setShowBossIntro(true);
      const t = setTimeout(() => setShowBossIntro(false), 1500);
      return () => clearTimeout(t);
    }
  }, [isBoss, activeLevel?.id]);

  useEffect(() => {
    let active = true;
    const cached = getStoredStudyProgress();
    setProgress(cached);

    loadStudyProgress().then((normalized) => {
      if (!active) return;
      setProgress(normalized);
      saveStudyProgress(normalized);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (!island) { navigate('/study'); return; }
    navigate(`/study/${island.id}`);
  }, [island, navigate]);

  if (!island || !activeLevel) {
    return (
      <div style={{ minHeight: '100vh', background: '#041524', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
            <Waves size={56} color="#60a5fa" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 900, margin: '0 0 14px' }}>Level not found!</p>
          <button onClick={() => navigate('/study')}
            style={{ border: 'none', borderRadius: 14, padding: '12px 20px', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontFamily: "'Nunito',sans-serif" }}>
            ← Back to World Map
          </button>
        </div>
      </div>
    );
  }

  const islandUnlocked = isIslandUnlocked(progress, island.id);
  const phraseUnlocked = phraseIndex === 0 || isLevelCompleted(progress, island.id, island.levels[phraseIndex - 1]?.id);
  const levelUnlocked = islandUnlocked && phraseUnlocked;
  const alreadyCompleted = isLevelCompleted(progress, island.id, activeLevel.id);

  const panelTitle = activeLevel.label;
  const panelDescription = activeLevel.description;
  const panelTip = activeLevel.tip;

  const targetWord = phraseLevel?.label ? String(phraseLevel.label).replace(/\s+/g, '').toUpperCase() : '';
  const isLetterTarget = targetWord.length === 1;
  const verifyModelType = isLetterTarget ? 'static' : 'dynamic';
  const verifyEndpoint = isLetterTarget ? '/api/gesture/verify/static' : '/api/gesture/verify/dynamic';
  const verifyThreshold = isLetterTarget ? LETTER_THRESHOLD : WORD_THRESHOLD;
  const minFramesForVerify = isLetterTarget ? LETTER_MIN_FRAMES_FOR_VERIFY : WORD_MIN_FRAMES_FOR_VERIFY;
  const frameBufferSize = isLetterTarget ? LETTER_FRAME_BUFFER_SIZE : WORD_FRAME_BUFFER_SIZE;
  const captureIntervalMs = isLetterTarget ? LETTER_CAPTURE_INTERVAL_MS : WORD_CAPTURE_INTERVAL_MS;

  const clearProcessingTimers = useCallback(() => {
    processingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    processingTimersRef.current = [];
  }, []);

  const startProcessingFeedback = useCallback(() => {
    clearProcessingTimers();
    setShowProcessingModal(true);
    setProcessingPhase('waiting');
    setProcessingMessage('Waiting for your recording package...');

    const readingTimer = window.setTimeout(() => {
      setProcessingPhase('reading');
      setProcessingMessage('Reading captured frames...');
    }, 320);
    const checkingTimer = window.setTimeout(() => {
      setProcessingPhase('checking');
      setProcessingMessage('Checking your gesture...');
    }, 760);

    processingTimersRef.current.push(readingTimer, checkingTimer);
  }, [clearProcessingTimers]);

  const finishProcessingFeedback = useCallback((isSuccess, message) => {
    clearProcessingTimers();
    setProcessingPhase(isSuccess ? 'success' : 'error');
    setProcessingMessage(message);

    const closeTimer = window.setTimeout(() => {
      setShowProcessingModal(false);
    }, isSuccess ? 900 : 1500);
    processingTimersRef.current.push(closeTimer);
  }, [clearProcessingTimers]);

  useEffect(() => () => {
    clearProcessingTimers();
  }, [clearProcessingTimers]);

  const verifyCurrentFrames = useCallback(async (debugOverrideWord = null) => {
    if (isSubmittingRef.current || !targetWord || !levelUnlocked) return;
    if (frameBufferRef.current.length < minFramesForVerify) {
      setStatus(`Need ${minFramesForVerify - frameBufferRef.current.length} more frame(s) before checking`);
      return;
    }

    isSubmittingRef.current = true;
    setReadyToSubmit(false);
    startProcessingFeedback();
    setStatus(`Checking ${panelTitle}...`);

    try {
      const response = await postJson(verifyEndpoint, {
        target_word: targetWord,
        frames: frameBufferRef.current,
        top_k: 5,
        threshold: verifyThreshold,
        ...(debugOverrideWord && { debug_override_word: debugOverrideWord }),
      });

      setLatestResult(response);

      if (response.is_match) {
        const nextStreak = matchStreak + 1;
        if (nextStreak >= REQUIRED_STREAK) {
          setMatchStreak(0);
          setRecording(false);
          setStatus(`Correct sign ${REQUIRED_STREAK}/${REQUIRED_STREAK}. Completing level...`);
          finishProcessingFeedback(true, `Correct! Streak ${REQUIRED_STREAK}/${REQUIRED_STREAK}. Level complete.`);
          markComplete();
        } else {
          setMatchStreak(nextStreak);
          setStatus(`Correct sign ${nextStreak}/${REQUIRED_STREAK}. Record again then submit.`);
          finishProcessingFeedback(true, `Correct! Streak ${nextStreak}/${REQUIRED_STREAK}.`);
        }
      } else {
        const similarity = Number(response.similarity ?? 0).toFixed(3);
        const bestMatch = String(response.best_match || 'unknown').toUpperCase();
        setMatchStreak(0);
        // Wrong answer — break the level streak
        levelStreakRef.current = 0;
        setLevelStreak(0);
        try { sessionStorage.setItem('ss_level_streak', '0'); } catch {}
        setStatus(`Wrong gesture. Closest: ${bestMatch} · Similarity ${similarity}`);
        finishProcessingFeedback(false, `Wrong gesture. Closest: ${bestMatch} · Similarity ${similarity}`);
      }
    } catch (error) {
      setMatchStreak(0);
      setStatus(error.message || 'Verification failed');
      setReadyToSubmit(true);
      finishProcessingFeedback(false, error.message || 'Could not submit this recording.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [targetWord, levelUnlocked, minFramesForVerify, panelTitle, verifyEndpoint, verifyThreshold, finishProcessingFeedback, matchStreak, startProcessingFeedback]);

  const handleRecordToggle = useCallback(() => {
    if (!levelUnlocked) {
      setStatus('This level is locked. Complete previous levels first.');
      return;
    }
    if (isSubmittingRef.current || isCountingDown || showSuccess) return;

    if (!recording) {
      frameBufferRef.current = [];
      setCapturedFrames(0);
      setLatestResult(null);
      setReadyToSubmit(false);
      setCountdown(COUNTDOWN_SECONDS);
      setIsCountingDown(true);
      setStatus(`Get ready... ${COUNTDOWN_SECONDS}`);
      return;
    }

    setRecording(false);

    const stopFrame = takeFrame();
    if (stopFrame) {
      frameBufferRef.current = [...frameBufferRef.current, stopFrame].slice(-frameBufferSize);
      setCapturedFrames(frameBufferRef.current.length);
    }

    if (frameBufferRef.current.length > 0 && frameBufferRef.current.length < minFramesForVerify) {
      const padFrame = frameBufferRef.current[frameBufferRef.current.length - 1];
      while (frameBufferRef.current.length < minFramesForVerify) {
        frameBufferRef.current.push(padFrame);
      }
      setCapturedFrames(frameBufferRef.current.length);
    }

    if (frameBufferRef.current.length === 0) {
      setReadyToSubmit(false);
      setStatus('No frames captured. The guide circle is only a helper, try centering your hand and hold for 1 second.');
      return;
    }

    setReadyToSubmit(true);
    setStatus('Recording stopped. Press submit to verify.');
  }, [frameBufferSize, levelUnlocked, minFramesForVerify, recording, showSuccess, takeFrame, isCountingDown]);

  useEffect(() => {
    if (!isCountingDown) return undefined;
    if (countdown <= 0) {
      setIsCountingDown(false);
      setRecording(true);
      setStatus('Recording... hold the sign steady');
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdown, isCountingDown]);

  useEffect(() => {
    frameBufferRef.current = [];
    setCapturedFrames(0);
    setMatchStreak(0);
    setLatestResult(null);
    setStatus('Ready to verify');
    setRecording(false);
    setReadyToSubmit(false);
    setIsCountingDown(false);
    setCountdown(0);
    clearProcessingTimers();
    setShowProcessingModal(false);
  }, [clearProcessingTimers, levelId]);

  useEffect(() => {
    if (!recording || !levelUnlocked || !targetWord) return undefined;

    const intervalId = window.setInterval(() => {
      if (isSubmittingRef.current || !webcamRef.current) return;

      const screenshot = takeFrame();
      if (!screenshot) return;

      frameBufferRef.current = [...frameBufferRef.current, screenshot].slice(-frameBufferSize);
      setCapturedFrames(frameBufferRef.current.length);

      if (frameBufferRef.current.length < minFramesForVerify) {
        setStatus(`Collecting frames ${frameBufferRef.current.length}/${minFramesForVerify}...`);
      } else {
        setStatus(`Frames ready ${frameBufferRef.current.length}/${minFramesForVerify}. Tap stop when done.`);
      }
    }, captureIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [recording, levelUnlocked, targetWord, takeFrame, frameBufferSize, minFramesForVerify, captureIntervalMs]);

  useEffect(() => {
    if (!recording && !isCountingDown && !showSuccess && !alreadyCompleted && !readyToSubmit && status === 'Ready to verify') {
      setStatus('Tap record to start.');
    }
  }, [recording, isCountingDown, showSuccess, alreadyCompleted, readyToSubmit, status]);

  const markComplete = () => {
    if (!levelUnlocked || alreadyCompleted) return;

    setReadyToSubmit(false);
    setIsCountingDown(false);
    setCountdown(0);
    const updated = completeIslandLevel(progress, island.id, activeLevel.id);
    setProgress(updated);
    saveStudyProgress(updated);
    setShowSuccess(true);

    // Increment level streak (no wrong answers this level)
    const next = levelStreakRef.current + 1;
    levelStreakRef.current = next;
    setLevelStreak(next);
    try { sessionStorage.setItem('ss_level_streak', String(next)); } catch {}

    setTimeout(() => {
      setShowSuccess(false);
      const nextLevel = island.levels[phraseIndex + 1];
      if (nextLevel) { navigate(`/study/${island.id}/level/${nextLevel.id}`); return; }
      navigate(`/study/${island.id}`);
    }, 1800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,10,28,0.88)', backdropFilter: 'blur(8px)',
      padding: 20, fontFamily: "'Nunito', sans-serif",
    }}>

      {showIntro && (
        <FeatureIntroModal
          featureKey="level"
          title="Level"
          subtitle="Structured sign challenges to build fluency"
          Icon={BookOpen}
          accentColor="#fbbf24"
          steps={[
            { Icon: PlayCircle, label: 'Watch',   text: 'A tutorial shows you how to perform the sign before you start.' },
            { Icon: Hand,       label: 'Sign',    text: 'Perform the sign in front of the camera and submit your attempt.' },
            { Icon: Trophy,     label: 'Streak',  text: 'Hit the required streak to complete the level and earn XP.' },
          ]}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* success overlay */}
      {showSuccess && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isBoss ? 'rgba(15,5,0,0.85)' : 'rgba(2,10,28,0.82)', backdropFilter: 'blur(6px)',
          animation: 'fade-in 0.3s ease-out',
        }}>
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)', maxWidth: 380, padding: '0 20px' }}>
            {/* Animated glow ring */}
            <div style={{
              position: 'relative', width: 110, height: 110, margin: '0 auto 20px',
            }}>
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: `3px solid ${isBoss ? '#fbbf24' : '#34d399'}`,
                opacity: 0.3, animation: 'ring-expand 1.2s ease-out forwards',
              }} />
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: isBoss ? 'linear-gradient(135deg,#fbbf24,#ef4444)' : 'linear-gradient(135deg,#34d399,#22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isBoss ? '0 0 40px rgba(251,191,36,0.5)' : '0 0 32px rgba(52,211,153,0.4)',
              }}>
                {isBoss
                  ? <span style={{ fontSize: 44 }}>{bossInfo?.icon || '👑'}</span>
                  : <CheckCircle size={48} color="white" />}
              </div>
            </div>

            {/* Title */}
            <p style={{
              fontSize: isBoss ? 30 : 26, fontWeight: 900, color: 'white',
              margin: '0 0 6px', textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>
              {isBoss ? '🏆 ISLAND CONQUERED!' : '✨ Level Complete!'}
            </p>

            {/* Subtitle */}
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 18px', fontWeight: 700, lineHeight: 1.5 }}>
              {isBoss ? 'Amazing! You conquered the final challenge!' : `You mastered the sign for "${activeLevel?.label}"`}
            </p>

            {/* XP Reward card */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '10px 20px',
              animation: 'slide-up 0.3s ease-out 0.2s both',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(251,191,36,0.3)',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#000' }}>⚡</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Reward</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>+{activeLevel?.rewardXp || 5} XP</div>
              </div>
            </div>

            {/* Moving to next text */}
            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '16px 0 0', fontWeight: 700,
              animation: 'pulse-text 1.5s ease-in-out infinite',
            }}>
              {isBoss ? 'Returning to world map...' : 'Moving to next level...'}
            </p>
          </div>

          {/* Sparkles/confetti for ALL levels */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {Array.from({ length: isBoss ? 40 : 16 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: 4 + Math.random() * (isBoss ? 8 : 4),
                height: 4 + Math.random() * (isBoss ? 8 : 4),
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: isBoss
                  ? ['#fbbf24','#ef4444','#34d399','#60a5fa','#a855f7','#fb923c'][i % 6]
                  : ['#34d399','#22d3ee','#60a5fa','#fbbf24'][i % 4],
                animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.6}s forwards`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Boss intro overlay - MENACING */}
      {showBossIntro && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(40,0,0,0.97) 0%, rgba(0,0,0,0.99) 70%)',
          backdropFilter: 'blur(10px)',
          animation: 'boss-fade-in 0.25s ease',
        }}>
          {/* Red vignette pulse */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(220,0,0,0.18) 100%)', animation: 'boss-vignette 0.8s ease-in-out infinite alternate', pointerEvents: 'none' }} />

          {/* Lightning bolts */}
          {['15%','80%','50%'].map((left, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, left, fontSize: 28, animation: `boss-lightning ${0.4 + i * 0.15}s ease-out ${i * 0.12}s both`, opacity: 0, pointerEvents: 'none' }}>⚡</div>
          ))}

          <div style={{ textAlign: 'center', animation: 'boss-slam 0.5s cubic-bezier(0.22,1,0.36,1)', position: 'relative', zIndex: 2 }}>
            {/* Warning label */}
            <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16, animation: 'boss-flicker 0.15s ease-in-out infinite alternate' }}>
              ⚠ FINAL CHALLENGE ⚠
            </div>

            {/* Boss icon - BIG */}
            <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 16, filter: 'drop-shadow(0 0 24px rgba(239,68,68,0.9))', animation: 'boss-icon-shake 0.18s ease-in-out infinite alternate' }}>
              {bossInfo?.icon || '💀'}
            </div>

            {/* Boss name */}
            <div style={{ fontSize: 38, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(239,68,68,0.8), 0 4px 20px rgba(0,0,0,0.8)', marginBottom: 8 }}>
              {activeLevel?.label}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.9)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Prove yourself. No mercy.
            </div>

            {/* HP-style bar */}
            <div style={{ marginTop: 20, width: 220, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', margin: '20px auto 0' }}>
              <div style={{ height: '100%', width: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #ef4444, #dc2626)', boxShadow: '0 0 12px rgba(239,68,68,0.8)', animation: 'boss-bar-drain 1.4s ease-out forwards' }} />
            </div>
            <div style={{ fontSize: 9, color: 'rgba(239,68,68,0.6)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>BOSS HP</div>
          </div>
        </div>
      )}

      <div className="ss-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1140, maxHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(52,211,153,0.1)', animation: 'ss-enter 0.35s ease-out' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: isBoss ? 'rgba(30,0,0,0.5)' : 'rgba(0,0,0,0.25)', borderBottom: `1px solid ${isBoss ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, flexShrink: 0 }}>
          {/* Left: Island name + level label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={13} color={isBoss ? '#ef4444' : '#34d399'} />
              <span style={{ fontSize: 10, fontWeight: 900, color: isBoss ? '#ef4444' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
                {isBoss ? '💀 Boss Level' : island.title}
              </span>
            </div>
            {/* Level progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 100, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${(activeLevel.order / island.levels.length) * 100}%`, background: isBoss ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#34d399,#22d3ee)', transition: 'width 0.5s ease', boxShadow: isBoss ? '0 0 6px rgba(239,68,68,0.5)' : '0 0 6px rgba(52,211,153,0.4)' }} />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, whiteSpace: 'nowrap' }}>Level {activeLevel.order} / {island.levels.length}</span>
            </div>
          </div>

          {/* Center: level streak flame */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Level Streak</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
              {levelStreak >= 2 && (
                <span style={{ fontSize: 18, animation: 'streak-flame 0.6s ease-in-out infinite alternate', filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.9))' }}>🔥</span>
              )}
              <span style={{
                fontSize: levelStreak >= 2 ? 22 : 18,
                fontWeight: 900,
                color: levelStreak >= 5 ? '#ef4444' : levelStreak >= 3 ? '#f97316' : levelStreak >= 2 ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                textShadow: levelStreak >= 2 ? `0 0 ${8 + levelStreak * 2}px ${levelStreak >= 5 ? 'rgba(239,68,68,0.8)' : levelStreak >= 3 ? 'rgba(249,115,22,0.8)' : 'rgba(251,191,36,0.7)'}` : 'none',
                animation: levelStreak >= 2 ? 'streak-pulse 0.8s ease-in-out infinite alternate' : undefined,
                transition: 'all 0.3s ease',
                lineHeight: 1,
              }}>{levelStreak}</span>
              {levelStreak >= 2 && (
                <span style={{ fontSize: 18, animation: 'streak-flame 0.6s ease-in-out infinite alternate', filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.9))', animationDelay: '0.3s' }}>🔥</span>
              )}
            </div>
          </div>
          <button onClick={handleClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} color="white" />
          </button>
        </div>

        <div className="ss-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* camera panel */}
        <div style={{ flex: 1, position: 'relative', background: '#040c18', minHeight: 420 }}>
          <Camera ref={webcamRef} />

          {/* DEBUG CONTROLS - only in dev */}
          {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG === 'true' && (
          <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={async () => {
              isSubmittingRef.current = true;
              try {
                const response = await postJson(verifyEndpoint, { target_word: targetWord, frames: ["data:image/jpeg;base64,mock"], top_k: 5, threshold: verifyThreshold, debug_override_word: targetWord });
                setLatestResult(response);
                if (response.is_match) {
                  setMatchStreak((value) => {
                    const next = value + 1;
                    setStatus(`Match ${next}/${REQUIRED_STREAK}`);
                    if (next >= REQUIRED_STREAK) {
                      setMatchStreak(0);
                      setRecording(false);
                      markComplete();
                    }
                    return next;
                  });
                }
              } finally { isSubmittingRef.current = false; }
            }}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
              Test: Correct
            </button>
            <button onClick={async () => {
              isSubmittingRef.current = true;
              try {
                const response = await postJson(verifyEndpoint, { target_word: targetWord, frames: ["data:image/jpeg;base64,mock"], top_k: 5, threshold: verifyThreshold, debug_override_word: 'wrongword' });
                setLatestResult(response);
                setStatus(`Closest: ${response.best_match}`);
                setMatchStreak(0);
              } finally { isSubmittingRef.current = false; }
            }}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
              Test: Wrong Word
            </button>
          </div>
          )}


          <div style={{ position: 'absolute', top: 14, left: 14, background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: recording ? 'white' : '#ef4444', animation: recording ? 'ss-blink 1s ease-in-out infinite' : undefined }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {isCountingDown ? `Starting ${countdown}` : recording ? 'Recording' : readyToSubmit ? 'Ready' : 'Camera'}
            </span>
          </div>

          {isCountingDown && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(2,10,28,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.4)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: 44, fontWeight: 900 }}>{countdown}</div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, background: 'linear-gradient(0deg, rgba(4,12,24,0.85) 0%, transparent 100%)' }}>
            <button onClick={handleRecordToggle} disabled={isCountingDown || showSuccess} style={{ width: 68, height: 68, borderRadius: '50%', border: `4px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.8)'}`, background: recording ? '#ef4444' : 'white', cursor: isCountingDown || showSuccess ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: recording ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', opacity: isCountingDown || showSuccess ? 0.5 : 1 }}>
              <Circle size={26} fill={recording ? 'white' : '#e63946'} color={recording ? 'white' : '#e63946'} />
            </button>
            {readyToSubmit && !showSuccess && (
              <button onClick={() => verifyCurrentFrames()} disabled={isSubmittingRef.current || isCountingDown} style={{ border: 'none', borderRadius: 99, padding: '10px 20px', cursor: 'pointer', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 12, boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}>
                <Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Submit
              </button>
            )}
            <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
              Frames: {capturedFrames}/{minFramesForVerify}
            </div>
          </div>
        </div>

        {/* info panel */}
        <div className="ss-panel" style={{ width: 380, flexShrink: 0, background: 'linear-gradient(180deg,#0e2347 0%,#091832 100%)', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px', gap: 12, overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Word card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(34,211,238,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: panelTitle.length <= 3 ? 64 : panelTitle.length <= 6 ? 52 : panelTitle.length <= 10 ? 40 : 30, fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word', overflowWrap: 'anywhere', background: isBoss ? 'linear-gradient(135deg,#fbbf24,#f97316)' : 'linear-gradient(135deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {panelTitle}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{panelDescription}</p>
          </div>

          <YouTubeTutorial word={activeLevel.label} isLetter={isLetterTarget} />

          <TipBox tip={panelTip} />

          <div style={{
            borderRadius: 14,
            background: latestResult
              ? latestResult.is_match
                ? 'rgba(34,197,94,0.16)'
                : 'rgba(239,68,68,0.16)'
              : 'rgba(255,255,255,0.08)',
            border: latestResult
              ? latestResult.is_match
                ? '1px solid rgba(74,222,128,0.35)'
                : '1px solid rgba(248,113,113,0.4)'
              : '1px solid rgba(255,255,255,0.14)',
            padding: '11px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 900, color: 'rgba(255,255,255,0.56)' }}>
              Live Verification
            </span>
            <p style={{ margin: 0, fontSize: 14, color: latestResult ? (latestResult.is_match ? '#bbf7d0' : '#fecaca') : 'white', fontWeight: 800 }}>{status}</p>
            <p style={{ margin: 0, fontSize: 12, color: latestResult ? (latestResult.is_match ? 'rgba(187,247,208,0.9)' : 'rgba(254,202,202,0.9)') : 'rgba(255,255,255,0.68)' }}>
              {latestResult
                ? `Best: ${String(latestResult.best_match || 'unknown').toUpperCase()} · Similarity: ${Number(latestResult.similarity ?? 0).toFixed(3)}`
                : 'Press record and hold the target sign in frame.'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.56)' }}>
              Model: {verifyModelType === 'static' ? 'Static (letter)' : 'Dynamic (word)'}
            </p>
            {latestResult && (
              <p style={{ margin: 0, fontSize: 12, color: latestResult.is_match ? '#86efac' : '#fca5a5', fontWeight: 800 }}>
                Streak: {matchStreak}/{REQUIRED_STREAK}{latestResult.is_match ? '' : ' (reset on miss)'}
              </p>
            )}
          </div>

          {/* level dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            {island.levels.map((level) => {
              const done = isLevelCompleted(progress, island.id, level.id);
              const current = level.id === activeLevel.id;
              return (
                <div key={level.id} style={{
                  borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: done ? '#064e3b' : current ? '#064e3b' : 'rgba(255,255,255,0.7)',
                  background: done ? '#34d399' : current ? '#22d3ee' : 'rgba(255,255,255,0.12)',
                  boxShadow: current ? '0 0 0 2px rgba(34,211,238,0.6)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  L{level.order}
                </div>
              );
            })}
          </div>

          {/* locked notice */}
          {!levelUnlocked && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)',
              color: '#fca5a5', borderRadius: 14, padding: '12px 14px',
              fontSize: 13, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <Lock size={15} /> This level is still locked.
            </div>
          )}

          {/* already done notice */}
          {alreadyCompleted && (
            <div style={{
              background: 'rgba(52,211,153,0.15)', border: '1.5px solid rgba(52,211,153,0.4)',
              color: '#a7f3d0', borderRadius: 14, padding: '12px 14px',
              fontSize: 13, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <CheckCircle size={14} color="#a7f3d0" /> Already completed! Practice again anytime.
            </div>
          )}

          {/* action button */}
          <button
            onClick={markComplete}
            disabled={!levelUnlocked || alreadyCompleted || !latestResult?.is_match}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg,#34d399,#22d3ee)',
              color: '#064e3b',
              fontSize: 16,
              fontWeight: 900,
              cursor: !levelUnlocked || alreadyCompleted || !latestResult?.is_match ? 'not-allowed' : 'pointer',
              opacity: !levelUnlocked || alreadyCompleted || !latestResult?.is_match ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: !levelUnlocked || alreadyCompleted ? 'none' : '0 8px 28px rgba(52,211,153,0.45)',
              flexShrink: 0, fontFamily: "'Nunito',sans-serif",
              transition: 'transform 0.18s ease, opacity 0.2s ease',
            }}
            onMouseEnter={e => { if (!(!levelUnlocked || alreadyCompleted || !latestResult?.is_match)) { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <>Verified Complete <ArrowRight size={18} /></>
          </button>
        </div>
      </div>
      </div>

      <GestureProcessingModal
        open={showProcessingModal}
        phase={processingPhase}
        message={processingMessage}
        onClose={() => setShowProcessingModal(false)}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes ss-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ss-enter { 0%{opacity:0;transform:scale(0.94) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fade-in { 0%{opacity:0} 100%{opacity:1} }
        @keyframes pop-in { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes boss-zoom { 0%{transform:scale(3);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes boss-fade-in { 0%{opacity:0} 100%{opacity:1} }
        @keyframes boss-slam { 0%{transform:scale(2.5) translateY(-40px);opacity:0} 60%{transform:scale(0.95) translateY(4px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes boss-icon-shake { 0%{transform:rotate(-4deg) scale(1.02)} 100%{transform:rotate(4deg) scale(0.98)} }
        @keyframes boss-flicker { 0%{opacity:1} 100%{opacity:0.5} }
        @keyframes boss-vignette { 0%{opacity:0.5} 100%{opacity:1} }
        @keyframes boss-lightning { 0%{opacity:1;transform:translateY(-20px) scale(1.5)} 100%{opacity:0;transform:translateY(120px) scale(0.8)} }
        @keyframes boss-bar-drain { 0%{width:100%} 100%{width:15%} }
        @keyframes streak-flame { 0%{transform:scale(1) rotate(-5deg)} 100%{transform:scale(1.2) rotate(5deg)} }
        @keyframes streak-pulse { 0%{transform:scale(1)} 100%{transform:scale(1.08)} }
        @keyframes confetti-fall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes ring-expand { 0%{transform:scale(0.5);opacity:0.6} 100%{transform:scale(1.3);opacity:0} }
        @keyframes slide-up { 0%{transform:translateY(12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes pulse-text { 0%,100%{opacity:0.45} 50%{opacity:0.8} }
        @media (max-width: 768px) {
          .ss-body { flex-direction: column !important; }
          .ss-panel { width: 100% !important; max-height: 50vh; }
        }
      `}</style>

      <button
        onClick={() => setShowIntro(true)}
        title="How to use Level"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.4)',
          color: '#fbbf24', fontSize: 16, fontWeight: 900, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Nunito',sans-serif",
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'background 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.28)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >?</button>
    </div>
  );
}
