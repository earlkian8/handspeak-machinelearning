import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X, Circle, CheckCircle2, AlertCircle, ArrowRight, MessageCircle, Trophy, RefreshCw, Zap, Video,
} from 'lucide-react';
import Camera from '../../components/Camera';
import GestureProcessingModal from '../../components/GestureProcessingModal';
import TipBox from '../../components/TipBox';
import TutorialModal from '../../components/TutorialModal';
import { useIslands } from '../../contexts/IslandsContext';
import { startConversationSession, submitConversationAttempt } from './conversationApi';

const CAPTURE_INTERVAL_MS = 250;
const MIN_FRAMES_FOR_VERIFY = 8;
const FRAME_BUFFER_SIZE = 20;
const COUNTDOWN_SECONDS = 3;

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('handspeak_user') || 'null');
    return user?.id ?? null;
  } catch {
    return null;
  }
};

export default function ReplyQuestSession() {
  const navigate = useNavigate();
  const { islandId } = useParams();
  const { getIslandById } = useIslands();
  const island = getIslandById(islandId);

  const [sessionId, setSessionId] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingPhase, setProcessingPhase] = useState('waiting');
  const [processingMessage, setProcessingMessage] = useState('');
  const [status, setStatus] = useState('Loading Reply Quest...');
  const [bootstrapError, setBootstrapError] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [correctPromptIds, setCorrectPromptIds] = useState(() => new Set());
  const [sessionSummary, setSessionSummary] = useState(null);
  const [typeResults, setTypeResults] = useState({ correct: 0, total: 0 });
  const [showTutorial, setShowTutorial] = useState(false);

  const webcamRef = useRef(null);
  const frameBufferRef = useRef([]);
  const isSubmittingRef = useRef(false);
  const processingTimersRef = useRef([]);

  const currentPrompt = prompts[currentIndex] || null;

  useEffect(() => {
    if (!islandId) return;
    let active = true;

    (async () => {
      const userId = getUserId();
      if (!userId) {
        setBootstrapError('You need to be signed in to start Reply Quest.');
        return;
      }
      try {
        const session = await startConversationSession({ userId, islandId });
        if (!active) return;
        setSessionId(session.session_id);
        setPrompts(session.prompts || []);
        setStatus('Read the prompt, then press record and sign your reply.');
      } catch (error) {
        if (active) setBootstrapError(error.message || 'Unable to start Reply Quest.');
      }
    })();

    return () => { active = false; };
  }, [islandId]);

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

  const resetFrameBuffer = useCallback(() => {
    frameBufferRef.current = [];
  }, []);

  const takeFrame = useCallback(() => {
    if (!webcamRef.current) return null;
    return webcamRef.current.captureFrame?.() || webcamRef.current.getScreenshot?.() || null;
  }, []);

  const advanceToNextPrompt = useCallback(() => {
    setLatestResult(null);
    resetFrameBuffer();
    setReadyToSubmit(false);
    setIsCountingDown(false);
    setCountdown(0);
    setStatus('Next prompt — read it, then record your reply.');
    setCurrentIndex((idx) => {
      const nextIdx = idx + 1;
      return nextIdx < prompts.length ? nextIdx : idx;
    });
  }, [prompts.length, resetFrameBuffer]);

  const submitCurrentFrames = useCallback(async (debugOverrideWord = null) => {
    if (isSubmittingRef.current || !currentPrompt || !sessionId) return;
    if (!debugOverrideWord && frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
      setStatus(`Need ${MIN_FRAMES_FOR_VERIFY - frameBufferRef.current.length} more frame(s) before checking.`);
      return;
    }

    isSubmittingRef.current = true;
    setReadyToSubmit(false);
    startProcessingFeedback();
    setStatus(`Scoring your reply for "${currentPrompt.expected_word.toUpperCase()}"...`);

    try {
      const response = await submitConversationAttempt({
        sessionId,
        promptId: currentPrompt.id,
        userId: getUserId(),
        frames: frameBufferRef.current.length ? frameBufferRef.current : ["data:image/jpeg;base64,mock"],
        debugOverrideWord,
      });

      setLatestResult(response);
      setStatus(response.feedback_text || (response.is_correct ? 'Correct!' : 'Not quite — try again.'));

      if (response.is_correct) {
        setCorrectPromptIds((prev) => {
          const next = new Set(prev);
          next.add(currentPrompt.id);
          return next;
        });
      }

      const rtb = response.response_type_breakdown;
      if (rtb && rtb.type_correct !== null && rtb.type_correct !== undefined) {
        setTypeResults((prev) => ({
          correct: prev.correct + (rtb.type_correct ? 1 : 0),
          total: prev.total + 1,
        }));
      }

      if (response.session_completed) {
        setSessionSummary({
          correct: response.correct_count,
          total: response.total_count,
          accuracy: response.total_count ? response.correct_count / response.total_count : 0,
        });
      }
      if (response.is_correct) {
        finishProcessingFeedback(
          true,
          `Correct. Closest read: ${(response.matched_word || currentPrompt.expected_word).toUpperCase()} · Confidence ${Number(response.confidence || 0).toFixed(2)}`,
        );
      } else {
        finishProcessingFeedback(
          false,
          `Wrong gesture. Closest: ${(response.matched_word || 'unknown').toUpperCase()} · Confidence ${Number(response.confidence || 0).toFixed(2)}`,
        );
      }
    } catch (error) {
      setStatus(error.message || 'Scoring failed. Try again.');
      setReadyToSubmit(true);
      finishProcessingFeedback(false, error.message || 'Could not submit this recording.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [currentPrompt, finishProcessingFeedback, sessionId, startProcessingFeedback]);

  const handleRecordToggle = useCallback(() => {
    if (isSubmittingRef.current || isCountingDown) return;

    if (!recording) {
      resetFrameBuffer();
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
      frameBufferRef.current = [...frameBufferRef.current, stopFrame].slice(-FRAME_BUFFER_SIZE);
    }

    if (frameBufferRef.current.length === 0) {
      setReadyToSubmit(false);
      setStatus('No frames captured — center your hand in the guide circle and try again.');
      return;
    }

    if (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
      const pad = frameBufferRef.current[frameBufferRef.current.length - 1];
      while (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
        frameBufferRef.current.push(pad);
      }
    }

    setReadyToSubmit(true);
    setStatus('Recording stopped. Press submit to check your reply.');
  }, [isCountingDown, recording, takeFrame, resetFrameBuffer]);

  useEffect(() => {
    if (!isCountingDown) return undefined;
    if (countdown <= 0) {
      setIsCountingDown(false);
      setRecording(true);
      setStatus('Recording... hold the sign steady.');
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdown, isCountingDown]);

  useEffect(() => {
    if (!recording || !currentPrompt) return undefined;
    const intervalId = window.setInterval(() => {
      if (isSubmittingRef.current || !webcamRef.current) return;
      const screenshot = takeFrame();
      if (!screenshot) return;
      frameBufferRef.current = [...frameBufferRef.current, screenshot].slice(-FRAME_BUFFER_SIZE);
      if (frameBufferRef.current.length < MIN_FRAMES_FOR_VERIFY) {
        setStatus(`Collecting frames ${frameBufferRef.current.length}/${MIN_FRAMES_FOR_VERIFY}...`);
      }
    }, CAPTURE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [recording, currentPrompt, takeFrame]);

  useEffect(() => {
    resetFrameBuffer();
    setLatestResult(null);
    setReadyToSubmit(false);
    setIsCountingDown(false);
    setCountdown(0);
  }, [currentPrompt?.id, resetFrameBuffer]);

  if (!island) {
    return <FullScreenMessage title="Island not found" onBack={() => navigate('/islands')} />;
  }

  if (bootstrapError) {
    return <FullScreenMessage title="Reply Quest unavailable" subtitle={bootstrapError} onBack={() => navigate(`/islands/${islandId}`)} />;
  }

  if (sessionSummary) {
    return (
      <SummaryScreen
        island={island}
        summary={sessionSummary}
        typeResults={typeResults}
        onAgain={() => window.location.reload()}
        onExit={() => navigate(`/islands/${islandId}`)}
      />
    );
  }

  if (!currentPrompt) {
    return <FullScreenMessage title="Preparing prompts..." subtitle={status} />;
  }

  const totalPrompts = prompts.length;
  const correctCount = correctPromptIds.size;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,22,0.92)', backdropFilter: 'blur(14px)', fontFamily: "'Nunito', sans-serif" }}>
      <div className="rqs-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1140, maxHeight: 'calc(100vh - 32px)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(110,231,183,0.1)', animation: 'rqs-enter 0.35s ease-out' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={16} color="#6ee7b7" />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Reply Quest</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{currentIndex + 1} / {totalPrompts}</span>
          </div>
          <button onClick={() => navigate(`/islands/${islandId}`)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} color="white" />
          </button>
        </div>

        <div className="rqs-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Camera side */}
        <div style={{ flex: 1, position: 'relative', background: '#040c18', minHeight: 420 }}>
          <Camera ref={webcamRef} />

          {/* DEBUG CONTROLS - only in dev */}
          {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG === 'true' && (
            <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => submitCurrentFrames(currentPrompt.expected_word)}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                Test: Correct
              </button>
              <button onClick={() => submitCurrentFrames('wrongword')}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                Test: Wrong Word
              </button>
              {/* For testing Phase 2 response type mismatches, pass a valid word that is a known wrong type */}
              <button onClick={() => submitCurrentFrames('hello')}
                style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                Test: Wrong Type
              </button>
            </div>
          )}

          <div style={{ position: 'absolute', top: 14, left: 14, background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: recording ? 'white' : '#ef4444', animation: recording ? 'rqs-blink 1s ease-in-out infinite' : undefined }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {isCountingDown ? `Starting ${countdown}` : recording ? 'Recording' : readyToSubmit ? 'Ready' : 'Camera'}
            </span>
          </div>

          {isCountingDown && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(2,10,28,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid rgba(110,231,183,0.4)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7', fontSize: 44, fontWeight: 900 }}>{countdown}</div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, background: 'linear-gradient(0deg, rgba(4,12,24,0.85) 0%, transparent 100%)' }}>
            <button onClick={handleRecordToggle} disabled={isCountingDown} style={{ width: 68, height: 68, borderRadius: '50%', border: `4px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.8)'}`, background: recording ? '#ef4444' : 'white', cursor: isCountingDown ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: recording ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', opacity: isCountingDown ? 0.5 : 1 }}>
              <Circle size={26} fill={recording ? 'white' : '#e63946'} color={recording ? 'white' : '#e63946'} />
            </button>
            {readyToSubmit && (
              <button onClick={() => submitCurrentFrames()} disabled={isSubmittingRef.current || isCountingDown} style={{ border: 'none', borderRadius: 99, padding: '10px 20px', cursor: 'pointer', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 12, boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}>
                <Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Submit
              </button>
            )}
          </div>
        </div>

        {/* Prompt side */}
        <div className="rqs-panel" style={{ width: 380, flexShrink: 0, background: 'linear-gradient(180deg,#0e2347 0%,#091832 100%)', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px', gap: 12, overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              <MessageCircle size={10} style={{ display: 'inline', marginRight: 4 }} />
              Reply Quest
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>
              {currentIndex + 1} / {totalPrompts}
            </span>
          </div>

          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${totalPrompts ? Math.round((correctCount / totalPrompts) * 100) : 0}%`,
              background: 'linear-gradient(90deg,#34d399,#22d3ee)', transition: 'width 0.4s ease',
            }} />
          </div>

          {currentPrompt.situation && (
            <div style={{
              padding: '8px 0',
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                📍 Context
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#93c5fd', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{currentPrompt.situation.emoji}</span>
                {currentPrompt.situation.label}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {currentPrompt.situation.description}
              </div>
            </div>
          )}

          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)',
            borderRadius: 18, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>NPC Prompt</div>
              {currentPrompt.response_type_label && (
                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(167,139,250,0.18)', color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {currentPrompt.response_type_label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: 'white' }}>
              {currentPrompt.prompt_text}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', WebkitTextFillColor: 'rgba(255,255,255,0.55)' }}>Your Reply</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>
              {currentPrompt.expected_word.toUpperCase()}
            </div>
          </div>

          <button
            onClick={() => setShowTutorial(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
          >
            <Video size={13} /> How to sign this
          </button>

          {showTutorial && (
            <TutorialModal
              word={currentPrompt.expected_word}
              displayWord={currentPrompt.expected_word}
              videoWord={currentPrompt.expected_word}
              isLetter={false}
              onProceed={() => setShowTutorial(false)}
              onSkip={() => setShowTutorial(false)}
            />
          )}

          {currentPrompt.coaching_tip && (
            <TipBox tip={currentPrompt.coaching_tip} label="Coaching Tip" />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              borderRadius: 14,
              background: latestResult?.is_correct ? 'rgba(34,197,94,0.18)' : latestResult ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${latestResult?.is_correct ? 'rgba(52,211,153,0.45)' : latestResult ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)'}`,
              padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {latestResult?.is_correct ? (
                  <CheckCircle2 size={16} color="#4ade80" />
                ) : latestResult ? (
                  <AlertCircle size={16} color="#f87171" />
                ) : null}
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>
                  {latestResult?.is_correct ? 'Correct reply' : latestResult ? 'Not a match' : 'Waiting for your reply'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.78)' }}>{status}</p>
              {latestResult?.matched_word && (
                <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
                  Closest reading: {latestResult.matched_word.toUpperCase()} · {Number(latestResult.confidence || 0).toFixed(2)}
                </p>
              )}
            </div>

            {/* Phase 2: response type breakdown */}
            {latestResult?.response_type_breakdown && !latestResult.is_correct && (() => {
              const rtb = latestResult.response_type_breakdown;
              if (rtb.type_correct === false) {
                return (
                  <div style={{ borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Response type mismatch</span>
                      {rtb.actual_type_label && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(251,191,36,0.75)' }}>
                          You signed: {rtb.actual_type_label}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#fde68a', lineHeight: 1.5 }}>{rtb.explanation}</p>
                  </div>
                );
              }
              if (rtb.type_correct === true) {
                return (
                  <div style={{ borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7' }}>
                      Right response type — just needs the exact word.
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button onClick={() => { resetFrameBuffer(); setLatestResult(null); setStatus('Reset — press record and try again.'); }}
              style={{ flex: 1, border: 'none', borderRadius: 14, padding: '11px 12px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Retry
            </button>
            <button
              onClick={advanceToNextPrompt}
              disabled={!latestResult?.is_correct || currentIndex >= prompts.length - 1}
              style={{
                flex: 1, border: 'none', borderRadius: 14, padding: '11px 12px', cursor: (!latestResult?.is_correct || currentIndex >= prompts.length - 1) ? 'not-allowed' : 'pointer',
                background: latestResult?.is_correct ? 'linear-gradient(135deg,#34d399,#22d3ee)' : 'rgba(255,255,255,0.08)',
                color: latestResult?.is_correct ? '#064e3b' : 'rgba(255,255,255,0.5)',
                fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: (!latestResult?.is_correct || currentIndex >= prompts.length - 1) ? 0.6 : 1,
              }}>
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      </div>

      <GestureProcessingModal open={showProcessingModal} phase={processingPhase} message={processingMessage} onClose={() => setShowProcessingModal(false)} />

      <style>{`
        @keyframes rqs-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes rqs-enter { 0%{opacity:0;transform:scale(0.94) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @media (max-width: 768px) {
          .rqs-body { flex-direction: column !important; }
          .rqs-panel { width: 100% !important; max-height: 50vh; }
        }
      `}</style>
    </div>
  );
}

function FullScreenMessage({ title, subtitle, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: '#041524', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>{title}</h2>
        {subtitle && <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>}
        {onBack && (
          <button onClick={onBack}
            style={{ background: 'white', color: '#0369a1', border: 'none', borderRadius: 14, padding: '10px 20px', fontWeight: 900, cursor: 'pointer' }}>
            Go back
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryScreen({ island, summary, typeResults, onAgain, onExit }) {
  const typeAccuracy = typeResults.total > 0
    ? Math.round((typeResults.correct / typeResults.total) * 100)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 0%, #22d3ee 0%, #0369a1 60%, #041421 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 460, width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 24, padding: '28px 28px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.2)', border: '2px solid rgba(52,211,153,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Trophy size={36} color="#34d399" />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900 }}>Conversation Complete</h1>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.5 }}>
          You just finished your first Reply Quest on {island.title} Island.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginBottom: 24 }}>
          <Stat label="Prompts" value={`${summary.correct}/${summary.total}`} />
          <Stat label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} />
          {typeAccuracy !== null && (
            <Stat label="Type accuracy" value={`${typeAccuracy}%`} accent="#c4b5fd" />
          )}
        </div>
        {typeResults.total > 0 && typeResults.correct < typeResults.total && (
          <div style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: '#c4b5fd', lineHeight: 1.55 }}>
            You got the right response type {typeResults.correct}/{typeResults.total} times.
            Focus on matching the kind of reply the situation calls for.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onAgain}
            style={{ flex: 1, border: 'none', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 900 }}>
            Play again
          </button>
          <button onClick={onExit}
            style={{ flex: 1, border: 'none', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900 }}>
            Back to island
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent || 'white' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
