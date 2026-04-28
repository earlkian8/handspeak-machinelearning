import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, CheckCircle2, XCircle, Trophy, Calendar } from 'lucide-react';
import { fetchJson } from '../../lib/api';
import { normalizeWordEntry } from '../../lib/vocabulary';
import { getVideoUrl } from '../../components/TutorialModal';
import FeatureIntroModal, { isIntroSeen } from '../../components/FeatureIntroModal';
import {
  isTodayComplete, markTodayComplete, computeStreak, getDailyWords, getTodayString,
} from '../../lib/dailyChallenge';

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

function buildChoices(allWords, correctWord, dateStr) {
  const pool = allWords.filter(w => w.id !== correctWord.id);
  const rand = seededRandom(parseInt(dateStr.replace(/-/g, ''), 10) + correctWord.id.charCodeAt(0));
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const distractors = shuffled.slice(0, 3);
  return [correctWord, ...distractors].sort(() => rand() - 0.5);
}

const DAILY_STEPS = [
  { label: 'Daily',   text: '5 new signs every day — same challenge for everyone on the same date.' },
  { label: 'Watch',   text: 'Watch each sign video, then pick the matching English word.' },
  { label: 'Streak',  text: 'Complete today\'s set to extend your streak. Come back tomorrow!' },
];

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [allWords, setAllWords] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [alreadyDone] = useState(() => isTodayComplete());
  const [streak, setStreak] = useState(() => computeStreak());
  const [showIntro, setShowIntro] = useState(() => !isIntroSeen('daily'));
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const dateStr = getTodayString();

  useEffect(() => {
    fetchJson('/api/gesture/words')
      .then(data => {
        const normalized = data.map((e, i) => normalizeWordEntry(e, i));
        setAllWords(normalized);
        const daily = getDailyWords(normalized, 5);
        setQuestions(daily.map(word => ({
          word,
          choices: buildChoices(normalized, word, dateStr),
        })));
      })
      .finally(() => setLoading(false));
  }, [dateStr]);

  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIdx]);

  const handleSelect = useCallback((choice) => {
    if (selected !== null || alreadyDone) return;
    setSelected(choice.id);
    const correct = choice.id === currentQ.word.id;
    if (correct) setScore(s => s + 1);

    advanceTimerRef.current = window.setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        markTodayComplete();
        setStreak(computeStreak());
        setDone(true);
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
      }
    }, AUTO_ADVANCE_MS);
  }, [selected, alreadyDone, currentQ, currentIdx, questions.length]);

  useEffect(() => () => window.clearTimeout(advanceTimerRef.current), []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#020a1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (done) return <CompleteScreen score={score} total={questions.length} streak={streak} onExit={() => navigate('/dashboard')} />;

  if (alreadyDone) return <AlreadyDoneScreen streak={streak} onExit={() => navigate('/dashboard')} />;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% -10%, #c2410c 0%, #9a3412 25%, #431407 60%, #020a1c 100%)', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {showIntro && (
        <FeatureIntroModal
          featureKey="daily"
          title="Daily Challenge"
          subtitle="5 signs a day — build a streak"
          Icon={Flame}
          accentColor="#f97316"
          steps={DAILY_STEPS}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={() => navigate('/dashboard')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={16} color="#f97316" />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Daily Challenge</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', maxWidth: 200, margin: '0 auto' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${((currentIdx + (selected ? 1 : 0)) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#f97316,#ef4444)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: 99, padding: '4px 10px', flexShrink: 0 }}>
          <Flame size={12} color="#f97316" fill="#f97316" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#fed7aa' }}>{streak}</span>
        </div>
      </div>

      {/* Content */}
      {currentQ && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 32px', gap: 20 }}>

          {/* Date + question count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 99, padding: '5px 12px' }}>
              <Calendar size={11} color="#f97316" />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa' }}>{dateStr}</span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{currentIdx + 1} / {questions.length}</span>
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
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>No video available</div>
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
                  onMouseEnter={e => { if (selected === null) e.currentTarget.style.background = 'rgba(249,115,22,0.18)'; }}
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
        title="How Daily Challenge works"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, width: 36, height: 36, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', border: '1.5px solid rgba(249,115,22,0.4)', color: '#f97316', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", boxShadow: '0 2px 12px rgba(0,0,0,0.4)', transition: 'background 0.15s ease, transform 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.28)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >?</button>
    </div>
  );
}

function CompleteScreen({ score, total, streak, onExit }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% -10%, #c2410c 0%, #9a3412 25%, #431407 60%, #020a1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(249,115,22,0.35)', borderRadius: 28, padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>🔥</div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Challenge Complete</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: 'white' }}>Come back tomorrow!</h1>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{score} / {total} correct · Great work keeping your streak alive.</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ background: 'rgba(249,115,22,0.2)', border: '1.5px solid rgba(249,115,22,0.45)', borderRadius: 18, padding: '14px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>Day Streak</div>
          </div>
        </div>
        <button onClick={onExit} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', background: 'linear-gradient(135deg,#f97316,#ef4444)', color: 'white', fontWeight: 900, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function AlreadyDoneScreen({ streak, onExit }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% -10%, #c2410c 0%, #9a3412 25%, #431407 60%, #020a1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(249,115,22,0.35)', borderRadius: 28, padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 14 }}>✅</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: 'white' }}>Already done today!</h1>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>You've completed today's challenge. Come back tomorrow to keep your streak going.</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ background: 'rgba(249,115,22,0.2)', border: '1.5px solid rgba(249,115,22,0.45)', borderRadius: 18, padding: '14px 28px' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>Day Streak</div>
          </div>
        </div>
        <button onClick={onExit} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', background: 'linear-gradient(135deg,#f97316,#ef4444)', color: 'white', fontWeight: 900, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
