import React, { useState } from 'react';

const BLOB_BASE = import.meta.env.VITE_BLOB_BASE_URL || 'https://2hku3a621tdz3iiv.public.blob.vercel-storage.com/videos';

// Filename differs from word key for these entries
const FILENAME_OVERRIDES = {
  hesheit: 'heshiet',
  refrigerator: 'refrigirator',
};

function getVideoUrl(word) {
  const key = word.toLowerCase();
  const filename = FILENAME_OVERRIDES[key] ?? key;
  return `${BLOB_BASE}/${filename}.mp4`;
}

export default function YouTubeTutorial({ word }) {
  const [error, setError] = useState(false);

  if (!word) return null;

  const url = getVideoUrl(word);

  return (
    <div>
      <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Tutorial Video
      </p>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.1)',
        height: 180, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!error ? (
          <video
            key={url}
            src={url}
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
