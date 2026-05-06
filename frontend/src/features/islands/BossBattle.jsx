import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, RotateCcw, Crown, Zap, HelpCircle, Hand, Keyboard } from 'lucide-react';
import { useIslands } from '../../contexts/IslandsContext';
import { getStoredStudyProgress, saveStudyProgress, completeIslandLevel } from '../study/studyVoyage';
import { McQuestion, TextInputQuestion, ActionQuestion } from './QuestionComponents';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBossQuestions(words, allWords) {
  const types = ['mc', 'text-input', 'action'];
  const shuffledWords = shuffle([...words]);
  return shuffledWords.map((word, i) => {
    const others = shuffle(allWords.filter(w => w.label !== word.label)).slice(0, 3);
    return { id: i, type: types[i % types.length], correct: word, choices: shuffle([word, ...others]) };
  });
}

const TYPE_BADGE = {
  mc:           { icon: <HelpCircle size={13} color="#fbbf24" />, label: 'Multiple Choice',  color: '#fde68a' },
  'text-input': { icon: <Keyboard   size={13} color="#fbbf24" />, label: 'Type the Word',    color: '#fde68a' },
  action:       { icon: <Hand       size={13} color="#fbbf24" />, label: 'Perform the Sign', color: '#fde68a' },
};

function BossIntro({ words, bossName, onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% -20%, #78350f 0%, #451a03 40%, #020617 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%', background: 'rgba(251,191,36,0.08)', border: '2px solid rgba(251,191,36,0.3)', borderRadius: 28, padding: '40px 32px', textAlign: 'center', boxShadow: '0 0 60px rgba(251,191,36,0.2)' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 50px rgba(251,191,36,0.5)', animation: 'boss-glow 2s ease-in-out infinite' }}>
          <Crown size={56} color="white" />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: 'white' }}>Boss Battle!</h1>
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{bossName || 'Island Boss'}</p>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6 }}>
          This is the final test! You need <strong style={{ color: '#fbbf24' }}>70% or higher</strong> to pass and unlock the next island.
        </p>
        
        <div style={{ background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.3)', borderRadius: 18, padding: '20px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>All Words You've Learned:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {words.map((word, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '6px 10px', fontSize: 13, fontWeight: 800, color: '#fde68a', textAlign: 'center' }}>
                {word.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: '16px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fca5a5', marginBottom: 8 }}>⚠️ Important</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 700, lineHeight: 1.5 }}>
            You'll face {words.length} questions using all 3 challenge types. Review the words above if you need to!
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            Back
          </button>
          <button onClick={onStart} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#78350f', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(251,191,36,0.4)' }}>
            <Zap size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Start Battle
          </button>
        </div>
      </div>
      <style>{`@keyframes boss-glow { 0%,100%{box-shadow:0 0 50px rgba(251,191,36,0.5)} 50%{box-shadow:0 0 80px rgba(251,191,36,0.8)} }`}</style>
    </div>
  );
}

function BossResult({ score, total, bossName, onComplete, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% -20%, #78350f 0%, #451a03 40%, #020617 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', background: 'rgba(251,191,36,0.08)', border: '2px solid rgba(251,191,36,0.3)', borderRadius: 28, padding: '40px 32px', textAlign: 'center', boxShadow: '0 0 60px rgba(251,191,36,0.2)' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: passed ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: passed ? '0 0 40px rgba(251,191,36,0.5)' : '0 0 40px rgba(239,68,68,0.4)', animation: 'boss-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {passed ? <Crown size={56} color="white" /> : <RotateCcw size={56} color="white" />}
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: 'white' }}>
          {passed ? 'Boss Defeated!' : 'Boss Battle Failed'}
        </h1>
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{bossName || 'Island Boss'}</p>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
          You scored {score}/{total} ({pct}%)
        </p>
        {passed ? (
          <>
            <div style={{ background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.3)', borderRadius: 18, padding: '16px', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', marginBottom: 6 }}>🎉 Island Completed!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>You can now proceed to the next island!</div>
            </div>
            <button onClick={onComplete} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#78350f', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Zap size={18} /> Continue to Next Island
            </button>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: '16px', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fca5a5', marginBottom: 6 }}>Need 70% to pass</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Review the words and try again!</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                Back to Island
              </button>
              <button onClick={onRetry} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#78350f', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                <RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Try Again
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes boss-pop { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }`}</style>
    </div>
  );
}

export default function BossBattle() {
  const { islandId, levelId } = useParams();
  const navigate = useNavigate();
  const { getIslandById } = useIslands();
  const island = getIslandById(islandId);
  const level = island?.levels?.find(l => l.id === levelId);
  
  // Helper to get the specific word a user learned from a level (same logic as StudySession)
  const getLearnedWord = useCallback((level) => {
    const pool = level?.candidate_phrases || [];
    if (pool.length === 0) return null;
    
    try {
      const user = JSON.parse(localStorage.getItem('handspeak_user') || 'null');
      const key = `${user?.id || 'guest'}:${level.id}`;
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
      }
      const index = Math.abs(hash) % pool.length;
      return pool[index];
    } catch {
      return pool[0];
    }
  }, []);
  
  // For boss nodes, get ALL words from all learn levels
  let words = [];
  let allWords = [];
  
  if (level?.node_type === 'boss' && level?.boss_scope === 'all') {
    const learnLevels = island?.levels?.filter(l => l.node_type === 'learn' || !l.node_type) || [];
    words = learnLevels.map(l => getLearnedWord(l)).filter(Boolean);
    allWords = words;
  } else {
    words = level?.candidate_phrases || level?.candidatePhrases || [];
    allWords = island?.levels?.flatMap(l => l.candidate_phrases || l.candidatePhrases || []) || [];
  }
  
  const bossName = island?.boss?.name || 'Island Boss';
  
  const [phase, setPhase]           = useState('intro');
  const [questions]                 = useState(() => words.length ? buildBossQuestions(words, allWords) : []);
  const [current, setCurrent]       = useState(0);
  const [answers, setAnswers]       = useState({});
  const [actionResult, setActionResult] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  
  const onBack = () => navigate(`/study/${islandId}`);
  const onComplete = () => {
    const progress = getStoredStudyProgress();
    const updated = completeIslandLevel(progress, islandId, levelId);
    saveStudyProgress(updated);
    navigate(`/study/${islandId}`);
  };

  const q        = questions[current] || null;
  const answered = q ? q.id in answers : false;
  const score    = Object.values(answers).filter(a => a.correct).length;

  const advance = useCallback(() => {
    if (current + 1 >= questions.length) {
      setPhase('result');
    } else {
      setTransitioning(true);
      setTimeout(() => { setCurrent(c => c + 1); setActionResult(null); setTransitioning(false); }, 300);
    }
  }, [current, questions.length]);

  const handleAnswer = useCallback((choice, forceCorrect = null) => {
    if (!q || answered) return;
    const isCorrect = forceCorrect !== null ? forceCorrect : choice.label === q.correct.label;
    setAnswers(prev => ({ ...prev, [q.id]: { selected: choice, correct: isCorrect } }));
    if (q.type === 'action') {
      setActionResult(isCorrect);
      setTimeout(advance, 2000);
    }
  }, [q, answered, advance]);

  const handleRetry = () => {
    setCurrent(0);
    setAnswers({});
    setActionResult(null);
    setPhase('intro');
  };

  if (!island || !level || words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>Boss battle not found.</p>
          <button onClick={onBack} style={{ background: 'white', color: '#0369a1', border: 'none', borderRadius: 14, padding: '10px 18px', fontWeight: 900, cursor: 'pointer' }}>Back to Island</button>
        </div>
      </div>
    );
  }
  
  if (phase === 'intro') return <BossIntro words={words} bossName={bossName} onStart={() => setPhase('battle')} onBack={onBack} />;
  if (phase === 'result') return <BossResult score={score} total={questions.length} bossName={bossName} onComplete={onComplete} onRetry={handleRetry} onBack={onBack} />;

  const badge = TYPE_BADGE[q?.type];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% -20%, #78350f 0%, #451a03 40%, #020617 100%)', fontFamily: "'Nunito',sans-serif", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>

      <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 50, cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Crown size={12} /> Boss Battle
          </div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{bossName || 'Island Boss'}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{current + 1} / {questions.length}</div>
      </div>

      <div style={{ width: '100%', maxWidth: 560, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', transition: 'width 0.4s ease', boxShadow: '0 0 12px rgba(251,191,36,0.6)' }} />
      </div>

      {badge && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 99, padding: '5px 14px' }}>
          {badge.icon}
          <span style={{ fontSize: 11, fontWeight: 900, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{badge.label}</span>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 560, background: 'rgba(251,191,36,0.06)', border: '1.5px solid rgba(251,191,36,0.2)', borderRadius: 28, padding: '28px 24px', opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        {q?.type === 'mc'         && <McQuestion        question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
        {q?.type === 'text-input' && <TextInputQuestion question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
        {q?.type === 'action'     && <ActionQuestion    question={q} onAnswer={handleAnswer} answered={answered} result={actionResult} />}
      </div>

      {answered && q?.type !== 'action' && (
        <button onClick={advance} style={{ marginTop: 20, padding: '14px 36px', borderRadius: 99, border: 'none', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#78350f', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(251,191,36,0.4)', animation: 'appear 0.25s ease-out', display: 'flex', alignItems: 'center', gap: 8 }}>
          {current + 1 >= questions.length ? <><Trophy size={16} /> See Results</> : <>Next →</>}
        </button>
      )}

      <style>{`@keyframes appear{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
