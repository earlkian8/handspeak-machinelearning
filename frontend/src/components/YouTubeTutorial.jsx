import React, { useState } from 'react';

const BLOB_BASE = import.meta.env.VITE_BLOB_BASE_URL || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';
const ALPHA_BASE = 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs';

const FILENAME_OVERRIDES = {
  hesheit: 'heshiet',
  refrigerator: 'refrigirator',
};

function getVideoUrl(word) {
  const key = word.toLowerCase();
  const filename = FILENAME_OVERRIDES[key] ?? key;
  return `${BLOB_BASE}/${filename}.mp4`;
}

export default function YouTubeTutorial({ word, isLetter = false }) {
  const [error, setError] = useState(false);

  if (!word) return null;

  return (
    <div>
      <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Tutorial {isLetter ? 'Image' : 'Video'}
      </p>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.1)',
        height: 180, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isLetter ? (
          <img
            src={`${ALPHA_BASE}/${word.toLowerCase()}.gif`}
            alt={`ASL sign for letter ${word.toUpperCase()}`}
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : !error ? (
          <video
            key={getVideoUrl(word)}
            src={getVideoUrl(word)}
            controls
            loop
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={() => setError(true)}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>{word}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 5 }}>ASL Sign</div>
          </div>
        )}
      </div>
    </div>
  );
}
