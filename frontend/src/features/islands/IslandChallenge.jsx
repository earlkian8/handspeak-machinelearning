import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Eye, Hand, Trophy, ArrowRight, RotateCcw, Keyboard } from 'lucide-react';
import { useIslands } from '../../contexts/IslandsContext';
import { getStoredStudyProgress, isIslandCompleted } from '../study/studyVoyage';
import Camera from '../../components/Camera';

const ASL_IMG_BASE = 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs';
const BLOB_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BLOB_BASE_URL) || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';
const FILENAME_OVERRIDES = { hesheit: 'heshiet', refrigerator: 'refrigirator' };
function getVideoUrl(word) {
  const key = String(word).toLowerCase();
  const filename = FILENAME_OVERRIDES[key] ?? key;
  return `${BLOB_BASE}/${filename}.mp4`;
}
const TOTAL_QUESTIONS = 10;

/* ── shuffle helper ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── build 10 randomised questions from island data ── */
function buildQuestions(island) {
  const isAlphabet = island.id === 'alphabet';

  // Collect all candidate signs/phrases
  let pool = [];
  if (isAlphabet) {
    island.levels.forEach(lvl => {
      pool.push({ label: lvl.label, word: lvl.label, isLetter: true, description: lvl.description || '', tip: lvl.tip || '' });
    });
  } else {
    island.levels.forEach(lvl => {
      (lvl.candidatePhrases || []).forEach(p => {
        pool.push({ label: p.label, word: p.word || p.id, isLetter: false, description: p.description || '', tip: p.tip || '' });
      });
    });
  }

  if (pool.length < 4) return [];

  pool = shuffle(pool);
  // Deduplicate by label — same sign can appear in multiple levels
  const seen = new Set();
  pool = pool.filter(p => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  });
  if (pool.length < 4) return [];
  const selected = pool.slice(0, Math.min(TOTAL_QUESTIONS + 5, pool.length));

  const typeDistribution = ['mc', 'mc', 'mc', 'id', 'id', 'text-input', 'text-input', 'action', 'action', 'action'];
  const shuffledTypes = shuffle(typeDistribution).slice(0, TOTAL_QUESTIONS);

  return shuffledTypes.map((type, i) => {
    const correct = selected[i % selected.length];
    // Build wrong options from pool excluding correct
    const others = shuffle(pool.filter(p => p.label !== correct.label)).slice(0, 3);
    const choices = shuffle([correct, ...others]);
    return { id: i, type, correct, choices };
  });
}

/* ── shared choices grid ── */
function ChoicesGrid({ choices, correct, answered, selected, onAnswer }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 380 }}>
      {choices.map((choice, idx) => {
        const isCorrect = choice.label === correct.label;
        const isSelected = selected?.label === choice.label;
        let bg = 'rgba(255,255,255,0.08)', border = 'rgba(255,255,255,0.15)', color = 'white';
        if (answered) {
          if (isCorrect) { bg = 'rgba(52,211,153,0.25)'; border = '#34d399'; color = '#6ee7b7'; }
          else if (isSelected) { bg = 'rgba(239,68,68,0.25)'; border = '#ef4444'; color = '#fca5a5'; }
        }
        return (
          <button key={`${idx}-${choice.label}`} onClick={() => !answered && onAnswer(choice)} disabled={answered}
            style={{ padding: '14px 12px', borderRadius: 14, border: `2px solid ${border}`, background: bg, color, fontSize: 15, fontWeight: 900, cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {answered && isCorrect && <CheckCircle size={14} />}
            {answered && isSelected && !isCorrect && <XCircle size={14} />}
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Shared sign media: GIF for letters, video for words ── */
function SignMedia({ correct, height = 200 }) {
  const [videoError, setVideoError] = React.useState(false);
  if (correct.isLetter) {
    return (
      <div style={{ width: height, height, borderRadius: 18, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <img src={`${ASL_IMG_BASE}/${correct.label.toLowerCase()}.gif`} alt={`ASL ${correct.label}`}
          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
      </div>
    );
  }
  const videoSrc = getVideoUrl(correct.word || correct.label);
  return (
    <div style={{ width: '100%', maxWidth: 340, borderRadius: 18, overflow: 'hidden', background: '#040c18', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      {!videoError ? (
        <video key={videoSrc} src={videoSrc} controls autoPlay loop muted
          style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain' }}
          onError={() => setVideoError(true)} />
      ) : (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#60a5fa' }}>{correct.label}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>ASL Sign</div>
        </div>
      )}
    </div>
  );
}

/* ── Question renderers ── */
function McQuestion({ question, onAnswer, answered, selected }) {
  const { correct } = question;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        {correct.isLetter ? 'What letter is shown?' : 'What word is shown in the video?'}
      </p>
      <SignMedia correct={correct} />
      <ChoicesGrid choices={question.choices} correct={correct} answered={answered} selected={selected} onAnswer={onAnswer} />
    </div>
  );
}

function IdQuestion({ question, onAnswer, answered, selected }) {
  const { correct } = question;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        {correct.isLetter ? 'Which letter does this hand sign show?' : 'Which word does this sign mean?'}
      </p>
      <SignMedia correct={correct} />
      <ChoicesGrid choices={question.choices} correct={correct} answered={answered} selected={selected} onAnswer={onAnswer} />
    </div>
  );
}

function TextInputQuestion({ question, onAnswer, answered, selected }) {
  const { correct } = question;
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.trim().toLowerCase() === correct.label.toLowerCase();
    onAnswer({ label: userInput.trim() }, isCorrect);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !answered) handleSubmit();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        {correct.isLetter ? 'Type the letter shown in this sign:' : 'Type the word shown in this video:'}
      </p>
      <SignMedia correct={correct} />
      
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={answered}
          placeholder="Type your answer here..."
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: answered
              ? selected?.label.toLowerCase() === correct.label.toLowerCase()
                ? '2px solid #34d399'
                : '2px solid #ef4444'
              : '2px solid rgba(255,255,255,0.15)',
            background: answered
              ? selected?.label.toLowerCase() === correct.label.toLowerCase()
                ? 'rgba(52,211,153,0.15)'
                : 'rgba(239,68,68,0.15)'
              : 'rgba(255,255,255,0.08)',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Nunito',sans-serif",
            outline: 'none',
            textAlign: 'center'
          }}
        />
        
        {!answered && (
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            style={{
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: userInput.trim() ? 'linear-gradient(135deg,#34d399,#22d3ee)' : 'rgba(255,255,255,0.1)',
              color: userInput.trim() ? '#064e3b' : 'rgba(255,255,255,0.3)',
              fontSize: 15,
              fontWeight: 900,
              cursor: userInput.trim() ? 'pointer' : 'not-allowed',
              fontFamily: "'Nunito',sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <CheckCircle size={16} /> Submit Answer
          </button>
        )}
        
        {answered && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: selected?.label.toLowerCase() === correct.label.toLowerCase()
              ? 'rgba(52,211,153,0.2)'
              : 'rgba(239,68,68,0.2)',
            border: selected?.label.toLowerCase() === correct.label.toLowerCase()
              ? '1.5px solid rgba(52,211,153,0.4)'
              : '1.5px solid rgba(239,68,68,0.4)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 800,
              color: selected?.label.toLowerCase() === correct.label.toLowerCase() ? '#6ee7b7' : '#fca5a5',
              marginBottom: 4
            }}>
              {selected?.label.toLowerCase() === correct.label.toLowerCase() ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            {selected?.label.toLowerCase() !== correct.label.toLowerCase() && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                The correct answer is: <strong style={{ color: '#6ee7b7' }}>{correct.label}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionQuestion({ question, onAnswer, answered, result }) {
  const webcamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recordingIntervalRef = useRef(null);
  const framesRef = useRef([]);

  const startRecording = useCallback(() => {
    framesRef.current = [];
    setRecording(true);
    
    recordingIntervalRef.current = setInterval(() => {
      if (webcamRef.current?.captureFrame) {
        const frame = webcamRef.current.captureFrame();
        if (frame) framesRef.current.push(frame);
      }
    }, 100); // Capture frame every 100ms
  }, []);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const frames = framesRef.current;
    if (frames.length === 0) {
      onAnswer({ label: question.correct.label }, false);
      return;
    }

    setProcessing(true);

    try {
      const { postJson } = await import('../../lib/api');
      const isLetter = question.correct.isLetter;
      const endpoint = isLetter ? '/api/gesture/verify/static' : '/api/gesture/verify/dynamic';
      
      const response = await postJson(endpoint, {
        target_word: question.correct.label,
        frames: frames,
        threshold: isLetter ? 0.65 : 0.35,
        top_k: 5,
        model_type: isLetter ? 'static' : 'dynamic'
      });

      const isCorrect = response.is_match;
      onAnswer({ label: question.correct.label }, isCorrect);
    } catch (error) {
      console.error('Gesture verification failed:', error);
      onAnswer({ label: question.correct.label }, false);
    } finally {
      setProcessing(false);
      framesRef.current = [];
    }
  }, [question.correct, onAnswer]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        Perform this sign in front of the camera:
      </p>
      <div style={{ fontSize: 52, fontWeight: 900, background: 'linear-gradient(135deg,#fb923c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
        {question.correct.label}
      </div>

      {/* Camera preview */}
      <div style={{ width: '100%', maxWidth: 340, borderRadius: 18, overflow: 'hidden', background: '#040c18', minHeight: 200, position: 'relative' }}>
        <Camera ref={webcamRef} />
        {recording && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.9)', borderRadius: 99, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recording</span>
          </div>
        )}
      </div>

      {!answered && !recording && !processing && (
        <button
          onClick={startRecording}
          style={{ padding: '14px 32px', borderRadius: 99, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 6px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hand size={16} /> Start Recording
        </button>
      )}

      {!answered && recording && (
        <button
          onClick={stopRecording}
          style={{ padding: '14px 32px', borderRadius: 99, border: '2px solid #ef4444', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> Stop & Submit
        </button>
      )}

      {processing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Analyzing your gesture...</p>
        </div>
      )}

      {answered && (
        <div style={{ padding: '16px 20px', borderRadius: 16, background: result ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)', border: result ? '2px solid rgba(52,211,153,0.4)' : '2px solid rgba(239,68,68,0.4)', textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: result ? '#6ee7b7' : '#fca5a5', marginBottom: 4 }}>
            {result ? '✓ Correct!' : '✗ Not quite right'}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
            {result ? `Great job performing "${question.correct.label}"!` : `Keep practicing "${question.correct.label}" — you'll get it!`}
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

/* ── Results Screen ── */
function ResultsScreen({ score, total, islandTitle, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: passed ? 'linear-gradient(135deg,#34d399,#22d3ee)' : 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: passed ? '0 0 40px rgba(52,211,153,0.4)' : '0 0 40px rgba(239,68,68,0.3)', animation: 'rc-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {passed ? <Trophy size={52} color="white" /> : <RotateCcw size={52} color="white" />}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 6 }}>
          {passed ? 'Challenge Passed!' : 'Almost There!'}
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{islandTitle} Challenge</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '20px 40px' }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: passed ? '#34d399' : '#fb923c', lineHeight: 1 }}>{score}/{total}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 4 }}>questions correct</div>
      </div>
      <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 340, lineHeight: 1.6, fontWeight: 700 }}>
        {passed
          ? `Amazing work! You scored ${pct}% and earned +30 XP!`
          : `You scored ${pct}%. You need 70% to pass. Keep practicing and try again!`}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onRetry} style={{ padding: '14px 28px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          <RotateCcw size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />Try Again
        </button>
        <button onClick={onBack} style={{ padding: '14px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          Back to Island <ArrowRight size={14} style={{ display:'inline', verticalAlign:'middle' }} />
        </button>
      </div>
      <style>{`@keyframes rc-pop { 0%{transform:scale(0.6);opacity:0} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

/* ── Main component ── */
export default function IslandChallenge() {
  const { islandId } = useParams();
  const navigate = useNavigate();
  const { getIslandById } = useIslands();
  const island = getIslandById(islandId);

  const progress = getStoredStudyProgress();
  const completed = island ? isIslandCompleted(progress, islandId) : false;

  const [questions, setQuestions] = useState(() => island ? buildQuestions(island) : []);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selected, correct } }
  const [actionResult, setActionResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const q = questions[current] || null;
  const answered = q ? q.id in answers : false;
  const score = Object.values(answers).filter(a => a.correct).length;

  const handleAnswer = useCallback((choice, forceCorrect = null) => {
    if (!q) return;
    const isCorrect = forceCorrect !== null ? forceCorrect : choice.label === q.correct.label;
    setAnswers(prev => ({ ...prev, [q.id]: { selected: choice, correct: isCorrect } }));
    if (q.type === 'action') {
      setActionResult(isCorrect);
      // Auto-advance after 2 seconds for action questions
      setTimeout(() => {
        if (current + 1 >= questions.length) {
          setShowResult(true);
        } else {
          setTransitioning(true);
          setTimeout(() => {
            setCurrent(c => c + 1);
            setActionResult(null);
            setTransitioning(false);
          }, 300);
        }
      }, 2000);
    }
  }, [q, current, questions.length]);

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(c => c + 1);
        setActionResult(null);
        setTransitioning(false);
      }, 300);
    }
  };

  const handleRetry = () => {
    setQuestions(buildQuestions(island));
    setCurrent(0);
    setAnswers({});
    setActionResult(null);
    setShowResult(false);
  };

  if (!island) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>Island not found.</p>
          <button onClick={() => navigate('/islands')} style={{ background: 'white', color: '#0369a1', border: 'none', borderRadius: 14, padding: '10px 18px', fontWeight: 900, cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    );
  }

  if (!completed) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif", padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(100,116,139,0.2)', border: '2px solid rgba(100,116,139,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <HelpCircle size={36} color="rgba(255,255,255,0.4)" />
          </div>
          <h2 style={{ margin: '0 0 12px', fontWeight: 900 }}>Challenge Locked</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Complete all levels in <strong>{island.title}</strong> to unlock this challenge!</p>
          <button onClick={() => navigate(`/islands/${islandId}`)} style={{ marginTop: 20, border: 'none', borderRadius: 14, padding: '12px 24px', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            Go to Island
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <p>Not enough content to build a challenge.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)', fontFamily: "'Nunito', sans-serif", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(`/islands/${islandId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 50, cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fb923c', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Chapter Challenge</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{island.title}</div>
        </div>
        {!showResult && (
          <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{current + 1}/{questions.length}</div>
        )}
      </div>

      {showResult ? (
        <div style={{ width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 28, overflow: 'hidden' }}>
          <ResultsScreen score={score} total={questions.length} islandTitle={island.title} onRetry={handleRetry} onBack={() => navigate(`/islands/${islandId}`)} />
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ width: '100%', maxWidth: 560, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#fb923c,#f97316)', transition: 'width 0.4s ease', boxShadow: '0 0 8px rgba(251,146,60,0.5)' }} />
          </div>

          {/* Question type badge */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '5px 14px' }}>
            {q?.type === 'mc' && <><HelpCircle size={13} color="#60a5fa" /><span style={{ fontSize: 11, fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Multiple Choice</span></>}
            {q?.type === 'id' && <><Eye size={13} color="#a78bfa" /><span style={{ fontSize: 11, fontWeight: 900, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Identify the Sign</span></>}
            {q?.type === 'text-input' && <><Keyboard size={13} color="#34d399" /><span style={{ fontSize: 11, fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Type the Word</span></>}
            {q?.type === 'action' && <><Hand size={13} color="#fb923c" /><span style={{ fontSize: 11, fontWeight: 900, color: '#fdba74', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Perform the Sign</span></>}
          </div>

          {/* Question card */}
          <div style={{ width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: '28px 24px', opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s ease' }}>
            {q?.type === 'mc' && <McQuestion question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
            {q?.type === 'id' && <IdQuestion question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
            {q?.type === 'text-input' && <TextInputQuestion question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
            {q?.type === 'action' && <ActionQuestion question={q} onAnswer={handleAnswer} answered={answered} result={actionResult} />}
          </div>

          {/* Next button */}
          {answered && q?.type !== 'action' && (
            <button onClick={handleNext} style={{ marginTop: 20, padding: '14px 36px', borderRadius: 99, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(52,211,153,0.35)', animation: 'next-appear 0.25s ease-out', display: 'flex', alignItems: 'center', gap: 8 }}>
              {current + 1 >= questions.length ? <><Trophy size={16} />See Results</> : <>Next Question <ArrowRight size={16} /></>}
            </button>
          )}
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes next-appear { 0%{transform:translateY(12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}
