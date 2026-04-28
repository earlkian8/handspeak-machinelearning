import React, { useCallback, useRef, useState } from 'react';
import { ChevronRight, RotateCcw, X } from 'lucide-react';

const BLOB_BASE = import.meta.env.VITE_BLOB_BASE_URL || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';

const FILENAME_OVERRIDES = {
  hesheit: 'heshiet',
  refrigerator: 'refrigirator',
};

function getVideoUrl(word) {
  const key = word.toLowerCase();
  const filename = FILENAME_OVERRIDES[key] ?? key;
  return `${BLOB_BASE}/${filename}.mp4`;
}

const SKIP_KEY = 'handspeak_level_tutorial_skip';

export function isTutorialSkipped() {
  try { return localStorage.getItem(SKIP_KEY) === 'true'; } catch { return false; }
}

export function clearTutorialSkip() {
  try { localStorage.removeItem(SKIP_KEY); } catch {}
}

export function markTutorialSkipped() {
  try { localStorage.setItem(SKIP_KEY, 'true'); } catch {}
}

export default function TutorialModal({ word, onProceed, onSkip }) {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const handleReplay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, []);

  const handleDontAskAgain = useCallback(() => {
    markTutorialSkipped();
    onProceed();
  }, [onProceed]);

  const url = word ? getVideoUrl(word) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,8,28,0.94)', backdropFilter: 'blur(14px)',
      padding: 20, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        background: 'linear-gradient(165deg, #0c1f3d 0%, #081428 100%)',
        border: '1px solid rgba(103,232,249,0.22)',
        borderRadius: 24, width: '100%', maxWidth: 520,
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(103,232,249,0.06)',
        overflow: 'hidden',
        animation: 'tut-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#67e8f9', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Watch Tutorial
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginTop: 2, lineHeight: 1.1 }}>{word}</div>
          </div>
          <button
            onClick={onSkip}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <X size={15} color="white" />
          </button>
        </div>

        {/* ── Video ── */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 252, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {url && !videoError ? (
              <video
                ref={videoRef}
                key={url}
                src={url}
                autoPlay
                loop
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                onError={() => setVideoError(true)}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>{word}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginTop: 8 }}>ASL Sign — no video available</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Replay ── */}
        <div style={{ padding: '10px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReplay}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 99, padding: '6px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
          >
            <RotateCcw size={13} /> Replay
          </button>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onSkip}
              style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
            >
              Skip
            </button>
            <button
              onClick={onProceed}
              style={{ flex: 2, padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #34d399, #22d3ee)', color: '#064e3b', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}
            >
              Proceed <ChevronRight size={15} />
            </button>
          </div>
          <button
            onClick={handleDontAskAgain}
            style={{ width: '100%', padding: '9px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.38)', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
          >
            Don't ask again for tutorials
          </button>
        </div>
      </div>
      <style>{`@keyframes tut-pop{from{transform:scale(0.92) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`}</style>
    </div>
  );
}
