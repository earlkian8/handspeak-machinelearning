import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import {
  getStoredStudyProgress,
  loadStudyProgress,
  isIslandUnlocked,
  isIslandCompleted,
  getIslandProgress,
} from '../study/studyVoyage';
import { useIslands } from '../../contexts/IslandsContext';
import IslandNode from './IslandNode';

export default function IslandsHub() {
  const navigate = useNavigate();
  const { islands: rawIslands, islandsLoading } = useIslands();
  const [progress, setProgress] = useState(() => getStoredStudyProgress());
  const mapContainerRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadStudyProgress().then((normalized) => {
      if (active) setProgress(normalized);
    });
    return () => { active = false; };
  }, []);

  const islands = useMemo(() => rawIslands.map((island) => {
    const unlocked = isIslandUnlocked(progress, island.id);
    const completed = isIslandCompleted(progress, island.id);
    const islandProgress = getIslandProgress(progress, island.id);
    return {
      ...island,
      unlocked,
      completed,
      active: unlocked && !completed, // Currently active node
      doneLevels: islandProgress.completedLevelIds.length,
      totalLevels: island.levels.length,
    };
  }), [rawIslands, progress]);

  // Auto-scroll to the currently active island
  useEffect(() => {
    if (!islandsLoading && islands.length > 0 && mapContainerRef.current) {
      const activeIndex = islands.findIndex(i => i.active);
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      
      setTimeout(() => {
        if (mapContainerRef.current) {
          const container = mapContainerRef.current;
          const islandWidth = 220; // Approx width of island node + margin
          const offset = (targetIndex * islandWidth) - (container.clientWidth / 2) + (islandWidth / 2);
          
          container.scrollTo({
            left: Math.max(0, offset),
            behavior: 'smooth'
          });
        }
      }, 500); // Wait for render
    }
  }, [islands, islandsLoading]);

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Nunito', sans-serif",
      background: 'radial-gradient(ellipse at 20% -10%, #38bdf8 0%, #0ea5e9 22%, #0369a1 52%, #082f49 80%, #041421 100%)',
      color: 'white',
      padding: '28px 24px 60px',
    }}>
      <header style={{
        maxWidth: 1100, margin: '0 auto', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: 28,
      }}>
        <button onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)',
            padding: '9px 16px', borderRadius: 50, cursor: 'pointer',
            color: 'white', fontWeight: 800, fontSize: 13,
          }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Your Voyage</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Islands of HandSpeak</div>
        </div>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 22,
          padding: '20px 24px', marginBottom: 40,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(56,189,248,0.18)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MessageCircle size={22} color="#60a5fa" />
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900 }}>One journey, three ways to practice</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
              Welcome to the HandSpeak archipelago! Journey from island to island. 
              Each island unlocks new signs and real conversations. Scroll to explore your voyage map.
            </p>
          </div>
        </div>

        {islandsLoading && islands.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700 }}>
            Loading map…
          </div>
        )}

        <div 
          ref={mapContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '240px 80px 140px 80px', // Increased top padding heavily so tooltip doesn't get clipped by the overflow container
            margin: '0 -24px', // Break out of container padding for edge-to-edge scrolling
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', // hide scrollbar for cleaner look
            msOverflowStyle: 'none',
            background: 'linear-gradient(to bottom, rgba(4,20,33,0) 0%, rgba(3,105,161,0.15) 50%, rgba(4,20,33,0) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
          }}
          className="hide-scrollbar"
        >
          {islands.map((island, index) => (
            <IslandNode 
              key={island.id}
              island={island}
              index={index}
              isFirst={index === 0}
              isLast={index === islands.length - 1}
              locked={!island.unlocked}
              completed={island.completed}
              active={island.unlocked && !island.completed}
              onClick={() => navigate(`/islands/${island.id}`)}
            />
          ))}
        </div>
      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
