import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, HelpCircle, Hand, Keyboard } from 'lucide-react';
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

function buildQuestions(words, allWords) {
  const types = ['mc', 'text-input', 'action'];
  return words.map((word, i) => {
    const others = shuffle(allWords.filter(w => w.label !== word.label)).slice(0, 3);
    return { id: i, type: types[i % types.length], correct: word, choices: shuffle([word, ...others]) };
  });
}

const TYPE_BADGE = {
  mc:           { icon: <HelpCircle size={13} color="#60a5fa" />, label: 'Multiple Choice',  color: '#93c5fd' },
  'text-input': { icon: <Keyboard   size={13} color="#34d399" />, label: 'Type the Word',    color: '#6ee7b7' },
  action:       { icon: <Hand       size={13} color="#fb923c" />, label: 'Perform the Sign', color: '#fdba74' },
};

function QuizIntro({ words, onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 460, width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(52,211,153,0.3)', borderRadius: 28, padding: '36px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}>📝</div>
        <h1 style={{ margin: '0 0 20px', fontSize: 26, fontWeight: 900, color: 'white' }}>Mini Quiz</h1>

        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>You'll be tested on:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {words.map((w, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', fontSize: 14, fontWeight: 800, color: 'white' }}>{w.label}</span>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 20px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Question types:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: <HelpCircle size={14} color="#60a5fa" />, text: 'Multiple Choice — watch the video, pick the right word' },
              { icon: <Keyboard   size={14} color="#34d399" />, text: 'Type the Word — watch the video, type what you see' },
              { icon: <Hand       size={14} color="#fb923c" />, text: 'Perform the Sign — see the word, do the gesture on camera' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {row.icon}
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Back</button>
          <button onClick={onStart} style={{ flex: 2, padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            Start Quiz →
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizResult({ score, total, onComplete, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: '36px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 14 }}>{score === total ? '🎉' : '📚'}</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: 'white' }}>
          {score === total ? 'Perfect!' : 'Quiz Done!'}
        </h1>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
          You got <strong style={{ color: 'white' }}>{score} out of {total}</strong> correct.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onBack} style={{ padding: '13px 22px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Back to Island</button>
          <button onClick={onComplete} style={{ padding: '13px 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Continue →</button>
        </div>
      </div>
    </div>
  );
}

export default function MiniQuiz() {
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
  
  // For quiz nodes, get the specific words from the 3 levels in quiz_scope
  let words = [];
  let allWords = [];
  
  if (level?.node_type === 'quiz' && level?.quiz_scope) {
    const scopeLevels = island?.levels?.filter(l => level.quiz_scope.includes(l.id)) || [];
    words = scopeLevels.map(l => getLearnedWord(l)).filter(Boolean);
    allWords = island?.levels?.filter(l => l.node_type === 'learn' || !l.node_type).map(l => getLearnedWord(l)).filter(Boolean);
  } else {
    words = level?.candidate_phrases || level?.candidatePhrases || [];
    allWords = island?.levels?.flatMap(l => l.candidate_phrases || l.candidatePhrases || []) || [];
  }
  
  const [phase, setPhase]           = useState('intro');
  const [questions]                 = useState(() => words.length ? buildQuestions(words, allWords) : []);
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

  if (!island || !level || words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>Quiz not found.</p>
          <button onClick={onBack} style={{ background: 'white', color: '#0369a1', border: 'none', borderRadius: 14, padding: '10px 18px', fontWeight: 900, cursor: 'pointer' }}>Back to Island</button>
        </div>
      </div>
    );
  }
  
  if (phase === 'intro') return <QuizIntro words={words} onStart={() => setPhase('quiz')} onBack={onBack} />;
  if (phase === 'result') return <QuizResult score={score} total={questions.length} onComplete={onComplete} onBack={onBack} />;

  const badge = TYPE_BADGE[q?.type];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% -10%, #1e3a5f 0%, #0f172a 50%, #020617 100%)', fontFamily: "'Nunito',sans-serif", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>

      <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 50, cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#34d399', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Mini Quiz</div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{island?.title || 'Quiz'}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{current + 1} / {questions.length}</div>
      </div>

      <div style={{ width: '100%', maxWidth: 560, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#34d399,#22d3ee)', transition: 'width 0.4s ease' }} />
      </div>

      {badge && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '5px 14px' }}>
          {badge.icon}
          <span style={{ fontSize: 11, fontWeight: 900, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{badge.label}</span>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: '28px 24px', opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        {q?.type === 'mc'         && <McQuestion        question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
        {q?.type === 'text-input' && <TextInputQuestion question={q} onAnswer={handleAnswer} answered={answered} selected={answers[q.id]?.selected} />}
        {q?.type === 'action'     && <ActionQuestion    question={q} onAnswer={handleAnswer} answered={answered} result={actionResult} />}
      </div>

      {answered && q?.type !== 'action' && (
        <button onClick={advance} style={{ marginTop: 20, padding: '14px 36px', borderRadius: 99, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", animation: 'appear 0.25s ease-out', display: 'flex', alignItems: 'center', gap: 8 }}>
          {current + 1 >= questions.length ? <><Trophy size={16} /> See Results</> : <>Next →</>}
        </button>
      )}

      <style>{`@keyframes appear{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
