import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { fetchJson } from '../../lib/api';
import { normalizeWordEntry } from '../../lib/vocabulary';
import { getVideoUrl } from '../../components/TutorialModal';
import FeatureIntroModal, { isIntroSeen } from '../../components/FeatureIntroModal';
import { recordActivity } from '../../lib/rewards';
import { showAchievements } from '../../components/AchievementToast';

const QUESTIONS_PER_ROUND = 10;
const DISTRACTORS = 3;
const AUTO_ADVANCE_MS = 1300;

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

function pickDistractors(allWords, correct, count) {
  const pool = allWords.filter(w => w.id !== correct.id);
  const rand = seededRandom(Date.now() + correct.id.charCodeAt(0));
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

function buildQuestions(words) {
  const rand = seededRandom(Date.now());
  const shuffled = [...words].sort(() => rand() - 0.5);
  const selected = shuffled.slice(0, QUESTIONS_PER_ROUND);
  return selected.map(word => {
    const distractors = pickDistractors(words, word, DISTRACTORS);
    const choices = [word, ...distractors].sort(() => rand() - 0.5);
    return { word, choices };
  });
}

const QUIZ_STEPS = [
  { label: 'Watch', text: 'A sign video plays — watch it carefully before picking your answer.' },
  { label: 'Pick',  text: 'Select the English word that matches the sign you just saw.' },
  { label: 'Score', text: 'Instant feedback after each answer. Complete all 10 to see your score.' },
];

export default function SignQuiz() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !isIntroSeen('quiz'));
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const advanceTimerRef = useRef(null);

  useEffect(() => {
    fetchJson('/api/gesture/words')
      .then(data => {
        const normalized = data.map((e, i) => normalizeWordEntry(e, i));
        setWords(normalized);
        setQuestions(buildQuestions(normalized));
      })
      .finally(() => setLoading(false));
  }, []);

  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIdx]);

  const handleSelect = useCallback((choice) => {
    if (selected !== null) return;
    setSelected(choice.id);
    const correct = choice.id === currentQ.word.id;
    if (correct) setScore(s => s + 1);

    advanceTimerRef.current = window.setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        const finalScore = correct ? score + 1 : score;
        recordActivity({ activityType: 'quiz', score: finalScore, total: questions.length })
          .then(r => r?.new_achievements && showAchievements(r.new_achievements));
        setDone(true);
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
      }
    }, AUTO_ADVANCE_MS);
  }, [selected, currentQ, currentIdx, questions.length]);

  useEffect(() => () => window.clearTimeout(advanceTimerRef.current), []);

  const restart = () => {
    setQuestions(buildQuestions(words));
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#020a1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f472b6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (done) return <EndScreen score={score} total={questions.length} onAgain={restart} onExit={() => navigate('/dashboard')} />;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% -10%, #be185d 0%, #9d174d 25%, #4a044e 60%, #020a1c 100%)', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {showIntro && (
        <FeatureIntroModal
          featureKey="quiz"
          title="Sign Quiz"
          subtitle="Can you identify what's being signed?"
          Icon={Brain}
          accentColor="#f472b6"
          steps={QUIZ_STEPS}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={() => navigate('/dashboard')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="#f472b6" />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Sign Quiz</span>
        </div>
        <div style={{ flex: 1 }}>
          {/* progress bar */}
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', maxWidth: 200, margin: '0 auto' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${((currentIdx + (selected ? 1 : 0)) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#f472b6,#c026d3)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 700, flexShrink: 0 }}>{currentIdx + 1} / {questions.length}</span>
      </div>

      {/* Content */}
      {currentQ && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 32px', gap: 20 }}>

          {/* Score chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 99, padding: '5px 14px' }}>
            <CheckCircle2 size={13} color="#f472b6" />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#f9a8d4' }}>{score} correct</span>
          </div>

          {/* Video card */}
          <div style={{ width: '100%', maxWidth: 440, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ height: 280, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {!videoError ? (
                <video
                  ref={videoRef}
                  key={currentQ.word.id}
                  src={getVideoUrl(currentQ.word.word || currentQ.word.label)}
                  autoPlay loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setVideoError(true)}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>No video — try to identify the sign</div>
                </div>
              )}
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>What is this sign?</div>
            </div>
          </div>

          {/* Choices */}
          <div style={{ width: '100%', maxWidth: 440, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {currentQ.choices.map(choice => {
              const isCorrect = choice.id === currentQ.word.id;
              const isSelected = selected === choice.id;
              let bg = 'rgba(255,255,255,0.08)';
              let border = '1.5px solid rgba(255,255,255,0.15)';
              let color = 'white';
              if (selected !== null) {
                if (isCorrect) { bg = 'rgba(52,211,153,0.25)'; border = '1.5px solid #34d399'; color = '#6ee7b7'; }
                else if (isSelected) { bg = 'rgba(239,68,68,0.2)'; border = '1.5px solid #ef4444'; color = '#fca5a5'; }
                else { bg = 'rgba(255,255,255,0.04)'; color = 'rgba(255,255,255,0.35)'; }
              }
              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelect(choice)}
                  disabled={selected !== null}
                  style={{ padding: '14px 12px', borderRadius: 16, border, background: bg, color, fontWeight: 900, fontSize: 14, cursor: selected !== null ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif", transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 52 }}
                  onMouseEnter={e => { if (selected === null) e.currentTarget.style.background = 'rgba(244,114,182,0.18)'; }}
                  onMouseLeave={e => { if (selected === null) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                >
                  {selected !== null && isCorrect && <CheckCircle2 size={14} color="#34d399" />}
                  {selected !== null && isSelected && !isCorrect && <XCircle size={14} color="#ef4444" />}
                  {choice.label || choice.word || choice.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowIntro(true)}
        title="How to use Sign Quiz"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, width: 36, height: 36, borderRadius: '50%', background: 'rgba(244,114,182,0.15)', border: '1.5px solid rgba(244,114,182,0.4)', color: '#f472b6', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", boxShadow: '0 2px 12px rgba(0,0,0,0.4)', transition: 'background 0.15s ease, transform 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.28)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >?</button>
    </div>
  );
}

function EndScreen({ score, total, onAgain, onExit }) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? { label: 'Excellent!', color: '#34d399' }
    : pct >= 70 ? { label: 'Good job!', color: '#60a5fa' }
    : pct >= 50 ? { label: 'Keep practicing!', color: '#fbbf24' }
    : { label: 'Keep at it!', color: '#f472b6' };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% -10%, #be185d 0%, #9d174d 25%, #4a044e 60%, #020a1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(244,114,182,0.3)', borderRadius: 28, padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(244,114,182,0.18)', border: '2px solid rgba(244,114,182,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trophy size={38} color="#f472b6" />
        </div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#f9a8d4', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Round Complete</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: 'white' }}>{grade.label}</h1>
        <div style={{ fontSize: 48, fontWeight: 900, color: grade.color, lineHeight: 1.1, margin: '12px 0' }}>{pct}%</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: 28 }}>{score} out of {total} correct</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onAgain} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '13px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Nunito',sans-serif" }}>
            <RotateCcw size={14} /> Play Again
          </button>
          <button onClick={onExit} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '13px', cursor: 'pointer', background: 'linear-gradient(135deg,#f472b6,#c026d3)', color: 'white', fontWeight: 900, fontFamily: "'Nunito',sans-serif" }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
