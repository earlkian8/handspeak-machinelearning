import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, RotateCcw, Sparkles, Compass, Gauge } from 'lucide-react';
import { getStoredStudyProgress, getIslandProgress, loadStudyProgress, isIslandUnlocked, isIslandCompleted } from '../study/studyVoyage';
import { fetchJson } from '../../lib/api';
import { useIslands } from '../../contexts/IslandsContext';
import IslandNode from './IslandNode';
import Skeleton from '../../components/Skeleton';

const MAX_DEPTH_METERS = 11034;

const OCEAN_ZONES = [
  {
    key: 'shore',
    name: 'Shoreline',
    subtitle: 'Coastal Edge',
    min: 0,
    max: 30,
    color: '#f7d7a9',
    soft: 'rgba(247, 215, 169, 0.2)',
  },
  {
    key: 'sunlit',
    name: 'Sunlit Zone',
    subtitle: 'Epipelagic',
    min: 30,
    max: 200,
    color: '#7dd3fc',
    soft: 'rgba(125, 211, 252, 0.2)',
  },
  {
    key: 'twilight',
    name: 'Twilight Zone',
    subtitle: 'Mesopelagic',
    min: 200,
    max: 1000,
    color: '#60a5fa',
    soft: 'rgba(96, 165, 250, 0.18)',
  },
  {
    key: 'midnight',
    name: 'Midnight Zone',
    subtitle: 'Bathypelagic',
    min: 1000,
    max: 4000,
    color: '#6366f1',
    soft: 'rgba(99, 102, 241, 0.17)',
  },
  {
    key: 'abyss',
    name: 'The Abyss',
    subtitle: 'Abyssopelagic',
    min: 4000,
    max: 6000,
    color: '#4338ca',
    soft: 'rgba(67, 56, 202, 0.16)',
  },
  {
    key: 'trenches',
    name: 'Trenches',
    subtitle: 'Hadalpelagic',
    min: 6000,
    max: MAX_DEPTH_METERS,
    color: '#1e1b4b',
    soft: 'rgba(30, 27, 75, 0.2)',
  },
];

const CHAPTER_ZONE_LAYOUT = [
  { key: 'sunlit', chapterMin: 1, chapterMax: 3 },
  { key: 'twilight', chapterMin: 4, chapterMax: 6 },
  { key: 'midnight', chapterMin: 7, chapterMax: 9 },
  { key: 'abyss', chapterMin: 10, chapterMax: 11 },
  { key: 'trenches', chapterMin: 12, chapterMax: 13 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getZoneByKey = (key) => OCEAN_ZONES.find((zone) => zone.key === key) || OCEAN_ZONES[0];

const getZoneByDepth = (depthMeters) => {
  for (let i = 0; i < OCEAN_ZONES.length; i += 1) {
    const zone = OCEAN_ZONES[i];
    const isLast = i === OCEAN_ZONES.length - 1;
    if ((depthMeters >= zone.min && depthMeters < zone.max) || (isLast && depthMeters <= zone.max)) {
      return zone;
    }
  }
  return OCEAN_ZONES[0];
};

const getDepthAndZoneForIsland = (island, index, totalIslands) => {
  if (island.id === 'alphabet') {
    return { depthMeters: 0, zone: getZoneByKey('shore') };
  }

  const chapterMatch = /^chapter-(\d+)$/.exec(island.id || '');
  if (chapterMatch) {
    const chapterNumber = Number(chapterMatch[1]);
    const zoneLayout = CHAPTER_ZONE_LAYOUT.find((entry) => chapterNumber >= entry.chapterMin && chapterNumber <= entry.chapterMax)
      || CHAPTER_ZONE_LAYOUT[CHAPTER_ZONE_LAYOUT.length - 1];
    const zone = getZoneByKey(zoneLayout.key);
    const range = Math.max(zoneLayout.chapterMax - zoneLayout.chapterMin, 1);
    const chapterProgress = (chapterNumber - zoneLayout.chapterMin) / range;
    const depthMeters = Math.round(zone.min + chapterProgress * (zone.max - zone.min));
    return { depthMeters, zone };
  }

  const ratio = totalIslands <= 1 ? 0 : index / (totalIslands - 1);
  const depthMeters = Math.round(ratio * MAX_DEPTH_METERS);
  return { depthMeters, zone: getZoneByDepth(depthMeters) };
};

function ParallaxBackdrop({ scrollY, scrollRatio }) {
  const driftSlow = scrollY * 0.05;
  const driftMedium = scrollY * 0.09;
  const driftFast = scrollY * 0.13;
  const deepFade = clamp((scrollRatio - 0.72) * 2.4, 0, 1);

  const shoreImageOpacity = clamp(1.06 - (scrollRatio * 2.5), 0, 1);
  const upperOceanOpacity = clamp(0.82 - (scrollRatio * 1.12), 0, 0.82);
  const midOceanOpacity = clamp((0.22 + (scrollRatio * 0.66)) * (1 - deepFade * 0.68), 0.16, 0.86);
  const deepOceanOpacity = clamp((scrollRatio - 0.14) * 1.6, 0, 0.96);
  const trenchTextureOpacity = clamp((scrollRatio - 0.5) * 2.55, 0, 1);

  const shoreGlowOpacity = clamp(0.88 - (scrollRatio * 2.1), 0, 0.88);
  const surfaceShimmerOpacity = clamp(0.2 - (scrollRatio * 0.32), 0, 0.2);
  const deepShadeOpacity = 0.2 + (scrollRatio * 0.78);
  const trenchFogOpacity = 0.32 + (scrollRatio * 0.62);
  const vignetteOpacity = 0.34 + (scrollRatio * 0.56);
  const topLightOpacity = clamp(0.78 - (scrollRatio * 1.95), 0, 0.78);
  const bottomBlanketOpacity = clamp((scrollRatio - 0.46) * 1.45, 0, 0.72);
  const deepTopCurtainOpacity = clamp((scrollRatio - 0.28) * 2.15, 0, 1);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #ccedff 0%, #88d9fb 16%, #318fce 37%, #12598f 58%, #0a335f 78%, #071f43 90%, #030b1f 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '-4% -4% -8%',
          opacity: shoreImageOpacity,
          backgroundImage: "linear-gradient(180deg, rgba(255,243,210,0.44) 0%, rgba(170,224,255,0.22) 40%, rgba(22,89,139,0.48) 88%, rgba(10,47,92,0.78) 100%), url('/shores%201.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          transform: `translateY(${driftSlow * 0.55}px) scale(1.06)`,
          transition: 'opacity 0.3s linear, transform 0.35s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '-4% -3% -6%',
          opacity: upperOceanOpacity,
          backgroundImage: "linear-gradient(180deg, rgba(152,222,255,0.18) 0%, rgba(34,112,171,0.36) 44%, rgba(8,40,89,0.8) 100%), url('/ocean.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 24%',
          transform: `translateY(${driftSlow}px) scale(1.06)`,
          transition: 'opacity 0.3s linear, transform 0.35s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '-5% -5% -8%',
          opacity: midOceanOpacity,
          backgroundImage: "linear-gradient(180deg, rgba(32,117,178,0) 0%, rgba(12,62,118,0.45) 34%, rgba(4,22,61,0.9) 100%), url('/ocean%202.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: `center ${50 + (scrollRatio * 22)}%`,
          transform: `translateY(${driftMedium}px) scale(1.08)`,
          transition: 'opacity 0.3s linear, transform 0.35s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '-6% -6% -10%',
          opacity: deepOceanOpacity,
          backgroundImage: "linear-gradient(180deg, rgba(16,70,130,0) 0%, rgba(8,33,80,0.56) 36%, rgba(2,10,33,0.97) 100%), url('/ocean%203.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 72%',
          transform: `translateY(${driftFast * 0.75}px) scale(1.1)`,
          transition: 'opacity 0.3s linear, transform 0.35s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '-8%',
          right: '-8%',
          top: '44%',
          bottom: '-14%',
          opacity: trenchTextureOpacity,
          backgroundImage: "linear-gradient(180deg, rgba(12,36,79,0) 0%, rgba(5,19,50,0.7) 34%, rgba(2,8,24,1) 100%), url('/ocean%204.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          transform: `translateY(${driftFast}px) scale(1.12)`,
          transition: 'opacity 0.3s linear, transform 0.35s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: shoreGlowOpacity,
          background: 'radial-gradient(120% 45% at 50% 2%, rgba(245,214,167,0.82), rgba(245,214,167,0.22) 36%, rgba(245,214,167,0) 72%)',
          transform: `translateY(${driftSlow}px)`,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '-8%',
          right: '-8%',
          top: '-8vh',
          height: '46vh',
          opacity: shoreGlowOpacity * 0.8,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(185,230,255,0.24) 42%, rgba(122,193,237,0.06) 100%)',
          filter: 'blur(16px)',
          transform: `translateY(${driftSlow * 0.6}px)`,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(19,49,103,0.22) 36%, rgba(5,13,36,0.66) 74%, rgba(3,8,20,0.9) 100%)',
          opacity: clamp(0.5 - (scrollRatio * 0.16), 0.22, 0.5),
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '-12%',
          right: '-12%',
          top: '-10vh',
          height: '56vh',
          opacity: surfaceShimmerOpacity,
          background: 'radial-gradient(120% 88% at 50% 2%, rgba(226,246,255,0.8) 0%, rgba(176,225,255,0.28) 40%, rgba(176,225,255,0) 78%)',
          transform: `translateY(${driftMedium * 0.4}px)`,
          filter: 'blur(11px)',
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: deepShadeOpacity,
          background: 'linear-gradient(180deg, rgba(4,17,43,0) 20%, rgba(7,18,42,0.42) 46%, rgba(4,10,25,0.94) 100%)',
          transform: `translateY(${driftFast * 0.3}px)`,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '-12%',
          right: '-12%',
          bottom: `${-180 + (driftFast * 0.8)}px`,
          height: '46vh',
          opacity: trenchFogOpacity,
          background: 'radial-gradient(ellipse at center, rgba(10,24,58,0.98) 0%, rgba(7,17,43,0.82) 42%, rgba(4,9,20,0) 80%)',
          filter: 'blur(2px)',
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 88% at 50% 6%, rgba(210,241,255,0.28), rgba(13, 28, 58, 0) 42%)',
          opacity: topLightOpacity,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(2,8,24,0.98) 0%, rgba(3,11,28,0.92) 20%, rgba(4,12,30,0.62) 42%, rgba(4,12,30,0.2) 58%, rgba(4,12,30,0) 72%)',
          opacity: deepTopCurtainOpacity,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(4,12,28,0) 32%, rgba(3,9,22,0.58) 66%, rgba(1,4,12,0.96) 100%)',
          opacity: bottomBlanketOpacity,
          transition: 'opacity 0.25s linear',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: vignetteOpacity,
          background: 'radial-gradient(140% 110% at 50% 48%, rgba(8, 22, 49, 0) 48%, rgba(3, 8, 20, 0.62) 100%)',
          transition: 'opacity 0.25s linear',
        }}
      />
    </div>
  );
}

function FloatingBubbles() {
  const bubbles = useMemo(
    () => Array.from({ length: 30 }, (_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 9,
      duration: 6 + Math.random() * 12,
      opacity: 0.12 + Math.random() * 0.24,
    })),
    [],
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          style={{
            position: 'absolute',
            left: bubble.left,
            bottom: '-16px',
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.5)',
            background: 'rgba(180, 233, 255, 0.18)',
            opacity: bubble.opacity,
            animation: `bubble-rise ${bubble.duration}s ease-in ${bubble.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function DepthMeter({ currentDepthMeters }) {
  const normalized = clamp(currentDepthMeters / MAX_DEPTH_METERS, 0, 1);
  const markerTop = clamp(normalized * 100, 0, 100);
  const tickDepths = [0, 100, 1000, 4000, 6000, MAX_DEPTH_METERS];

  return (
    <aside
      className="ocean-depth-meter"
      style={{
        position: 'fixed',
        left: 22,
        top: 112,
        bottom: 24,
        width: 102,
        zIndex: 18,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'linear-gradient(180deg, rgba(163, 226, 255, 0.16) 0%, rgba(9, 16, 34, 0.52) 100%)',
        backdropFilter: 'blur(10px)',
        padding: '12px 10px 14px',
        height: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Gauge size={14} color="#93c5fd" />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(220,242,255,0.92)' }}>
            Depth
          </span>
        </div>

        <div style={{ position: 'relative', height: 'min(64vh, 560px)', margin: '0 auto', width: 44 }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 19,
            width: 6,
            borderRadius: 999,
            background: 'linear-gradient(180deg, #7dd3fc 0%, #2563eb 34%, #312e81 68%, #0f172a 100%)',
            boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
          }} />

          {tickDepths.map((depth) => {
            const tickTop = clamp((depth / MAX_DEPTH_METERS) * 100, 0, 100);
            return (
              <div
                key={depth}
                style={{
                  position: 'absolute',
                  top: `calc(${tickTop}% - 1px)`,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 14, height: 2, borderRadius: 999, background: 'rgba(226, 245, 255, 0.8)' }} />
                <span style={{ fontSize: 9, color: 'rgba(222, 242, 255, 0.9)', fontWeight: 700 }}>
                  {depth.toLocaleString()}m
                </span>
              </div>
            );
          })}

          <div style={{
            position: 'absolute',
            top: `calc(${markerTop}% - 10px)`,
            left: 9,
            width: 24,
            height: 20,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
            boxShadow: '0 0 16px rgba(251,191,36,0.55)',
            transition: 'top 0.4s ease',
          }} />
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(201,232,255,0.72)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Current
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#dbeafe' }}>{Math.round(currentDepthMeters).toLocaleString()}m</div>
        </div>
      </div>
    </aside>
  );
}

function ZoneLegend({ currentDepthMeters, activeZoneKey }) {
  const activeZone = getZoneByKey(activeZoneKey) || getZoneByDepth(currentDepthMeters);

  return (
    <aside
      className="ocean-zone-legend"
      style={{
        position: 'fixed',
        right: 24,
        top: 116,
        width: 242,
        zIndex: 18,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.16)',
        background: 'linear-gradient(180deg, rgba(163,226,255,0.16) 0%, rgba(8,14,31,0.55) 100%)',
        backdropFilter: 'blur(10px)',
        padding: '14px 14px 12px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212, 238, 255, 0.9)', marginBottom: 10 }}>
          Ocean Zones
        </div>

        {OCEAN_ZONES.filter((zone) => zone.key !== 'shore').map((zone) => {
          const isActive = activeZone.key === zone.key;

          return (
            <div
              key={zone.key}
              style={{
                borderRadius: 14,
                border: isActive ? `1px solid ${zone.color}` : '1px solid rgba(255,255,255,0.1)',
                background: isActive
                  ? `linear-gradient(135deg, ${zone.soft}, rgba(15,23,42,0.42))`
                  : zone.soft,
                padding: '9px 10px',
                marginBottom: 8,
                boxShadow: isActive ? `0 0 0 1px ${zone.color}33, 0 0 18px ${zone.color}44` : 'none',
                transform: isActive ? 'translateX(-3px)' : 'translateX(0)',
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#e0f2fe' }}>{zone.name}</span>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: zone.color,
                    boxShadow: `0 0 8px ${zone.color}`,
                  }}
                />
              </div>
              <div style={{ marginTop: 3, fontSize: 10, color: 'rgba(186, 219, 242, 0.88)', fontWeight: 700 }}>
                {zone.subtitle} - {zone.min.toLocaleString()}m to {zone.max.toLocaleString()}m
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PathConnector({ completed, zoneColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', position: 'relative' }}>
      <svg width="44" height="66" viewBox="0 0 44 66">
        <path
          d="M 22 0 C 12 18, 32 35, 22 52 L 22 66"
          fill="none"
          stroke={completed ? zoneColor : 'rgba(148,163,184,0.55)'}
          strokeWidth="3"
          strokeDasharray={completed ? 'none' : '7 5'}
          strokeLinecap="round"
          opacity={completed ? 0.92 : 0.45}
        />
        {[14, 33, 52].map((y) => (
          <circle
            key={y}
            cx="22"
            cy={y}
            r="3"
            fill={completed ? zoneColor : 'rgba(100,116,139,0.55)'}
            opacity={completed ? 0.75 : 0.35}
          />
        ))}
      </svg>
    </div>
  );
}

export default function IslandsHub() {
  const navigate = useNavigate();
  const { islands: rawIslands, islandsLoading, error } = useIslands();
  const [masteryProgress, setMasteryProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [localProgress, setLocalProgress] = useState(() => getStoredStudyProgress());
  const [scrollY, setScrollY] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [focusedIslandId, setFocusedIslandId] = useState(null);
  const activeRef = useRef(null);
  const islandRefs = useRef({});

  const user = JSON.parse(localStorage.getItem('handspeak_user') || '{}');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const maxScrollable = Math.max((document.documentElement.scrollHeight || 0) - window.innerHeight, 1);
      setScrollY(y);
      setScrollRatio(clamp(y / maxScrollable, 0, 1));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    loadStudyProgress().then((progress) => {
      if (active) setLocalProgress(progress);
    });

    if (user?.id) {
      fetchJson(`/api/conversation/progress/${user.id}`)
        .then((data) => {
          if (active) {
            setMasteryProgress(data.islands);
            setLoadingProgress(false);
          }
        })
        .catch(() => {
          if (active) setLoadingProgress(false);
        });
    } else {
      setLoadingProgress(false);
    }

    return () => {
      active = false;
    };
  }, [user?.id]);

  const islands = useMemo(() => {
    if (!masteryProgress || rawIslands.length === 0) return [];

    return rawIslands.map((island, index) => {
      const record = masteryProgress.find((entry) => entry.island_id === island.id);
      const islandProgress = getIslandProgress(localProgress, island.id);
      const unlocked = isIslandUnlocked(localProgress, island.id);
      const completed = isIslandCompleted(localProgress, island.id);
      const depthData = getDepthAndZoneForIsland(island, index, rawIslands.length);

      return {
        ...island,
        unlocked,
        completed,
        masteryScores: record || null,
        active: unlocked && !completed,
        doneLevels: islandProgress.completedLevelIds.length,
        totalLevels: island.levels.length,
        zoneKey: depthData.zone.key,
        zoneName: depthData.zone.name,
        zoneColor: depthData.zone.color,
        depthMeters: depthData.depthMeters,
      };
    });
  }, [rawIslands, masteryProgress, localProgress]);

  useEffect(() => {
    if (activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [islands]);

  useEffect(() => {
    if (islands.length === 0) return;

    const updateFocusedIsland = () => {
      const y = window.scrollY || 0;
      const maxScrollable = Math.max((document.documentElement.scrollHeight || 0) - window.innerHeight, 1);
      const pageRatio = clamp(y / maxScrollable, 0, 1);

      if (pageRatio >= 0.985) {
        const lastIsland = islands[islands.length - 1];
        if (lastIsland) {
          setFocusedIslandId((previous) => (previous === lastIsland.id ? previous : lastIsland.id));
        }
        return;
      }

      if (pageRatio <= 0.015) {
        const firstIsland = islands[0];
        if (firstIsland) {
          setFocusedIslandId((previous) => (previous === firstIsland.id ? previous : firstIsland.id));
        }
        return;
      }

      const viewportAnchor = window.innerHeight * 0.48;
      let closest = null;

      islands.forEach((island) => {
        const node = islandRefs.current[island.id];
        if (!node) return;

        const rect = node.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const center = rect.top + (rect.height / 2);
        const distance = Math.abs(center - viewportAnchor);

        if (!closest || distance < closest.distance) {
          closest = { islandId: island.id, distance };
        }
      });

      if (!closest) return;

      setFocusedIslandId((previous) => (previous === closest.islandId ? previous : closest.islandId));
    };

    updateFocusedIsland();
    window.addEventListener('scroll', updateFocusedIsland, { passive: true });
    window.addEventListener('resize', updateFocusedIsland);

    return () => {
      window.removeEventListener('scroll', updateFocusedIsland);
      window.removeEventListener('resize', updateFocusedIsland);
    };
  }, [islands]);

  const totalLevels = islands.reduce((sum, island) => sum + island.totalLevels, 0);
  const doneLevels = islands.reduce((sum, island) => sum + island.doneLevels, 0);
  const overallPct = totalLevels ? Math.round((doneLevels / totalLevels) * 100) : 0;

  const focusedIsland = islands.find((island) => island.id === focusedIslandId)
    || islands.find((island) => island.active)
    || islands[0]
    || null;

  const currentDepthMeters = focusedIsland?.depthMeters ?? Math.round(scrollRatio * MAX_DEPTH_METERS);
  const activeZoneKey = focusedIsland?.zoneKey || getZoneByDepth(currentDepthMeters).key;

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Nunito', sans-serif",
        color: 'white',
        position: 'relative',
      }}
    >
      <ParallaxBackdrop scrollY={scrollY} scrollRatio={scrollRatio} />
      <FloatingBubbles />
      <DepthMeter currentDepthMeters={currentDepthMeters} />
      <ZoneLegend currentDepthMeters={currentDepthMeters} activeZoneKey={activeZoneKey} />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 26,
          background: 'rgba(2, 8, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.11)',
          padding: '14px 24px',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.16)',
              padding: '8px 16px',
              borderRadius: 50,
              cursor: 'pointer',
              color: 'white',
              fontWeight: 800,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <ArrowLeft size={15} /> Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Compass size={18} color="#67e8f9" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(220,242,255,0.54)' }}>
                Dive Map
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>Dive Zones of HandSpeak</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '6px 14px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(205, 229, 252, 0.64)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Journey
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399' }}>{overallPct}%</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '22px auto 8px', padding: '0 24px', position: 'relative', zIndex: 6 }}>
        <div
          style={{
            background: 'linear-gradient(140deg, rgba(10, 30, 64, 0.8) 0%, rgba(20, 62, 117, 0.68) 52%, rgba(10, 24, 52, 0.82) 100%)',
            border: '1px solid rgba(147, 223, 255, 0.5)',
            borderRadius: 22,
            padding: '16px 20px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 30px rgba(2, 8, 20, 0.35), inset 0 1px 0 rgba(205, 241, 255, 0.18)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(125,211,252,0.32), rgba(56,189,248,0.14))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(186, 230, 253, 0.48)',
            }}
          >
            <Sparkles size={20} color="#7dd3fc" />
          </div>

          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#e0f2fe', textShadow: '0 2px 10px rgba(2, 8, 22, 0.45)' }}>
              Dive Through The Zones
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(226, 242, 255, 0.95)', lineHeight: 1.5, fontWeight: 700 }}>
              Start at the shoreline and descend from Sunlit waters down to the Trenches as your chapter dives unlock.
            </p>
          </div>
        </div>
      </div>

      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '10px 24px 84px',
          position: 'relative',
          zIndex: 8,
        }}
      >
        {error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 20px',
              background: 'rgba(255, 0, 0, 0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 24,
              margin: '40px 0',
            }}
          >
            <MapIcon size={48} color="#ef4444" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: 20, margin: '0 0 8px', color: '#fca5a5' }}>Map Unavailable</h3>
            <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: 'none',
                color: '#fca5a5',
                padding: '10px 24px',
                borderRadius: 50,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RotateCcw size={16} /> Try Again
            </button>
          </div>
        ) : (islandsLoading || loadingProgress) || islands.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', padding: '40px 0' }}>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} style={{ width: '100%', maxWidth: 560 }}>
                <Skeleton width="100%" height={124} borderRadius={28} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {islands.map((island, index) => (
              <div
                key={island.id}
                ref={(node) => {
                  islandRefs.current[island.id] = node;
                  if (island.active) {
                    activeRef.current = node;
                  }
                }}
                style={{ width: '100%', maxWidth: 560 }}
              >
                <IslandNode
                  island={island}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === islands.length - 1}
                  locked={!island.unlocked}
                  completed={island.completed}
                  active={island.unlocked && !island.completed}
                  onClick={() => navigate(`/islands/${island.id}`)}
                />

                {index < islands.length - 1 && (
                  <PathConnector completed={island.completed} zoneColor={island.zoneColor || '#22d3ee'} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes bubble-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          12% { opacity: 1; }
          85% { opacity: 0.8; }
          100% { transform: translateY(-110vh) scale(0.75); opacity: 0; }
        }

        @media (max-width: 1120px) {
          .ocean-zone-legend,
          .ocean-depth-meter {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
