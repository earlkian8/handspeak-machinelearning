import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Hand } from 'lucide-react';
import Camera from '../../components/Camera';

const BLOB_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BLOB_BASE_URL) || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';
const ASL_IMG_BASE = 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs';
const FILENAME_OVERRIDES = { hesheit: 'heshiet', refrigerator: 'refrigirator' };

function getVideoUrl(word) {
  const key = String(word).toLowerCase();
  return `${BLOB_BASE}/${FILENAME_OVERRIDES[key] ?? key}.mp4`;
}

export function SignMedia({ correct }) {
  const [err, setErr] = useState(false);
  if (correct.isLetter) {
    return (
      <div style={{ width: 200, height: 200, borderRadius: 18, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={`${ASL_IMG_BASE}/${correct.label.toLowerCase()}.gif`} alt={`ASL ${correct.label}`} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
      </div>
    );
  }
  const src = getVideoUrl(correct.word || correct.label);
  return (
    <div style={{ width: '100%', maxWidth: 340, borderRadius: 18, overflow: 'hidden', background: '#040c18' }}>
      {!err
        ? <video key={src} src={src} controls autoPlay loop muted style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain' }} onError={() => setErr(true)} />
        : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 32, fontWeight: 900, color: '#60a5fa' }}>{correct.label}</span></div>
      }
    </div>
  );
}

export function McQuestion({ question, onAnswer, answered, selected }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white', textAlign: 'center' }}>
        What word does this sign mean?
      </p>
      <p style={{ margin: '-12px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textAlign: 'center' }}>
        Watch the video, then pick the correct word below.
      </p>
      <SignMedia correct={question.correct} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 380 }}>
        {question.choices.map((choice, idx) => {
          const isCorrect = choice.label === question.correct.label;
          const isSelected = selected?.label === choice.label;
          let bg = 'rgba(255,255,255,0.08)', border = 'rgba(255,255,255,0.15)', color = 'white';
          if (answered) {
            if (isCorrect) { bg = 'rgba(52,211,153,0.25)'; border = '#34d399'; color = '#6ee7b7'; }
            else if (isSelected) { bg = 'rgba(239,68,68,0.25)'; border = '#ef4444'; color = '#fca5a5'; }
          }
          return (
            <button key={idx} onClick={() => !answered && onAnswer(choice)} disabled={answered}
              style={{ padding: '14px 12px', borderRadius: 14, border: `2px solid ${border}`, background: bg, color, fontSize: 15, fontWeight: 900, cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {answered && isCorrect && <CheckCircle size={14} />}
              {answered && isSelected && !isCorrect && <XCircle size={14} />}
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TextInputQuestion({ question, onAnswer, answered, selected }) {
  const [input, setInput] = useState('');
  const isRight = selected?.label.toLowerCase() === question.correct.label.toLowerCase();

  const submit = () => {
    if (!input.trim()) return;
    onAnswer({ label: input.trim() }, input.trim().toLowerCase() === question.correct.label.toLowerCase());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white', textAlign: 'center' }}>
        What word does this sign mean?
      </p>
      <p style={{ margin: '-12px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textAlign: 'center' }}>
        Watch the video, then type the word in the box below.
      </p>
      <SignMedia correct={question.correct} />
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !answered && submit()}
          disabled={answered} placeholder="Type the word you see in the video..." autoFocus
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `2px solid ${answered ? (isRight ? '#34d399' : '#ef4444') : 'rgba(255,255,255,0.15)'}`, background: answered ? (isRight ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.08)', color: 'white', fontSize: 16, fontWeight: 700, fontFamily: "'Nunito',sans-serif", outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
        />
        {!answered && (
          <button onClick={submit} disabled={!input.trim()}
            style={{ padding: '14px', borderRadius: 14, border: 'none', background: input.trim() ? 'linear-gradient(135deg,#34d399,#22d3ee)' : 'rgba(255,255,255,0.08)', color: input.trim() ? '#064e3b' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 900, cursor: input.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Nunito',sans-serif" }}>
            Submit
          </button>
        )}
        {answered && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: isRight ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', border: `1.5px solid ${isRight ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, color: isRight ? '#6ee7b7' : '#fca5a5', fontSize: 14 }}>
              {isRight ? '✓ Correct!' : `✗ The answer is "${question.correct.label}"`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionQuestion({ question, onAnswer, answered, result }) {
  const webcamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const intervalRef = useRef(null);
  const framesRef = useRef([]);

  const start = useCallback(() => {
    framesRef.current = [];
    setRecording(true);
    intervalRef.current = setInterval(() => {
      const frame = webcamRef.current?.captureFrame?.();
      if (frame) framesRef.current.push(frame);
    }, 100);
  }, []);

  const stop = useCallback(async () => {
    setRecording(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    const frames = framesRef.current;
    if (!frames.length) { onAnswer({ label: question.correct.label }, false); return; }
    setProcessing(true);
    try {
      const { postJson } = await import('../../lib/api');
      const res = await postJson('/api/gesture/verify/dynamic', {
        target_word: question.correct.label, frames, threshold: 0.35, top_k: 5, model_type: 'dynamic',
      });
      onAnswer({ label: question.correct.label }, res.is_match);
    } catch {
      onAnswer({ label: question.correct.label }, false);
    } finally {
      setProcessing(false);
      framesRef.current = [];
    }
  }, [question.correct, onAnswer]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white', textAlign: 'center' }}>
        Perform this sign in front of the camera:
      </p>
      <p style={{ margin: '-8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textAlign: 'center' }}>
        Click <strong style={{ color: 'white' }}>Start Recording</strong>, do the sign, then click <strong style={{ color: 'white' }}>Stop & Submit</strong>.
      </p>
      <div style={{ fontSize: 48, fontWeight: 900, background: 'linear-gradient(135deg,#fb923c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
        {question.correct.label}
      </div>
      <div style={{ width: '100%', maxWidth: 340, borderRadius: 18, overflow: 'hidden', background: '#040c18', position: 'relative' }}>
        <Camera ref={webcamRef} />
        {recording && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.9)', borderRadius: 99, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, animation: 'rec-pulse 1.2s ease-in-out infinite' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'white', letterSpacing: '0.08em' }}>REC</span>
          </div>
        )}
      </div>
      {!answered && !recording && !processing && (
        <button onClick={start} style={{ padding: '13px 28px', borderRadius: 99, border: 'none', background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#064e3b', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hand size={15} /> Start Recording
        </button>
      )}
      {!answered && recording && (
        <button onClick={stop} style={{ padding: '13px 28px', borderRadius: 99, border: '2px solid #ef4444', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={15} /> Stop & Submit
        </button>
      )}
      {processing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Analyzing...</span>
        </div>
      )}
      {answered && (
        <div style={{ padding: '14px 20px', borderRadius: 14, background: result ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', border: `2px solid ${result ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: result ? '#6ee7b7' : '#fca5a5' }}>
            {result ? `✓ Correct! Great sign for "${question.correct.label}"` : `✗ Not quite — keep practicing "${question.correct.label}"`}
          </div>
        </div>
      )}
      <style>{`
        @keyframes rec-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
