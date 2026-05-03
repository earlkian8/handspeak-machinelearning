import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, Eye, EyeOff, Fish } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { postJson } from '../../lib/api';
import Spinner from '../../components/Spinner';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('kids');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kidName, setKidName] = useState('');
  const [kidSignInName, setKidSignInName] = useState('');
  const [kidError, setKidError] = useState('');
  const [kidBusy, setKidBusy] = useState(false);
  const [kidSignInBusy, setKidSignInBusy] = useState(false);
  const [kidCreateBusy, setKidCreateBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Inline defensive validation
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address.'); return; }
    if (!agreed) { toast.error('Please agree to the terms to continue.'); return; }

    setIsLoading(true);
    try {
      const user = await postJson('/api/auth/signin', { email, password });
      toast.success('Successfully logged in!');
      localStorage.setItem('handspeak_user', JSON.stringify(user));
      onLogin(user);
      navigate(user.profile_complete ? '/dashboard' : '/welcome');
    } catch (signInError) {
      const msg = signInError.message || 'Unable to sign in';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKidPlayNow = async () => {
    setKidError('');
    setKidBusy(true);
    try {
      const user = await postJson('/api/auth/guest', {});
      localStorage.setItem('handspeak_user', JSON.stringify(user));
      onLogin(user);
      toast.success(`Welcome ${user.nickname || 'Diver'}!`);
      navigate('/dashboard');
    } catch (guestError) {
      const msg = guestError.message || 'Unable to start a guest session';
      setKidError(msg);
      toast.error(msg);
    } finally {
      setKidBusy(false);
    }
  };

  const handleKidCreate = async () => {
    setKidError('');
    if (!kidName.trim()) {
      toast.error('Pick a username first.');
      return;
    }
    setKidCreateBusy(true);
    try {
      const user = await postJson('/api/auth/kids', { nickname: kidName.trim() });
      localStorage.setItem('handspeak_user', JSON.stringify(user));
      onLogin(user);
      toast.success('Your account is ready!');
      navigate('/dashboard');
    } catch (kidCreateError) {
      const msg = kidCreateError.message || 'Unable to create account';
      setKidError(msg);
      toast.error(msg);
    } finally {
      setKidCreateBusy(false);
    }
  };

  const handleKidSignIn = async () => {
    setKidError('');
    if (!kidSignInName.trim()) {
      toast.error('Enter your username.');
      return;
    }
    setKidSignInBusy(true);
    try {
      const user = await postJson('/api/auth/kids-signin', { nickname: kidSignInName.trim() });
      localStorage.setItem('handspeak_user', JSON.stringify(user));
      onLogin(user);
      toast.success(`Welcome back, ${user.nickname || 'Diver'}!`);
      navigate('/dashboard');
    } catch (kidSignInError) {
      const msg = kidSignInError.message || 'Username not found';
      setKidError(msg);
      toast.error(msg);
    } finally {
      setKidSignInBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif" }}>
      <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 20 }}>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: 4, boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}>
          {['kids', 'adult'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              style={{
                border: 'none',
                background: mode === item ? '#0ea5e9' : 'transparent',
                color: mode === item ? 'white' : '#0f172a',
                fontWeight: 800,
                padding: '8px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {item === 'kids' ? 'Kids Mode' : 'Adult Mode'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'kids' ? (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #06234c 0%, #0b4aa0 35%, #1e88e5 62%, #6dd5fa 85%, #c7f3ff 100%)' }}>
          {[{ top: '14%', size: 58, dur: '15s', dir: 'r' }, { top: '34%', size: 36, dur: '18s', dir: 'l' }, { top: '62%', size: 44, dur: '13s', dir: 'r' }].map((fish, i) => (
            <div key={i} className={`kids-fish-${fish.dir}`} style={{ top: fish.top, animationDuration: fish.dur }}>
              <svg width={fish.size} height={fish.size * 0.6} viewBox="0 0 80 48" fill="none">
                <ellipse cx="35" cy="24" rx="26" ry="16" fill="rgba(255,255,255,0.22)" />
                <polygon points="58,24 76,10 76,38" fill="rgba(255,255,255,0.22)" />
                <circle cx="22" cy="20" r="4" fill="rgba(0,0,0,0.2)" />
                <circle cx="23" cy="19" r="1.5" fill="rgba(255,255,255,0.55)" />
              </svg>
            </div>
          ))}

          {[{ l: '10%', b: '18%', w: 9, d: '4s' }, { l: '24%', b: '28%', w: 6, d: '3.2s' }, { l: '70%', b: '16%', w: 11, d: '4.8s' }, { l: '85%', b: '26%', w: 7, d: '3.6s' }].map((bubble, i) => (
            <div key={i} className="kids-bubble" style={{ left: bubble.l, bottom: bubble.b, width: bubble.w, height: bubble.w, animationDuration: bubble.d }} />
          ))}

          <div className="relative z-10 w-full max-w-xl px-5">
            <div style={{
              background: 'white',
              borderRadius: 28,
              padding: '40px 36px',
              boxShadow: '0 28px 70px rgba(3, 105, 161, 0.35)',
              border: '2px solid rgba(14,165,233,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f7ff, #b3e5fc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(2,132,199,0.25)'
                }}>
                  <Anchor size={36} color="#0284c7" />
                </div>
              </div>

              <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Diver License</h1>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, marginBottom: 24 }}>
                Pick how you want to start your adventure.
              </p>

              {kidError && (
                <div style={{
                  background: '#fff1f2',
                  border: '1.5px solid #fecdd3',
                  color: '#be123c',
                  borderRadius: 14,
                  padding: '12px 16px',
                  fontSize: 14,
                  marginBottom: 18,
                  fontWeight: 700,
                  textAlign: 'center',
                }}>
                  {kidError}
                </div>
              )}

              <div style={{ display: 'grid', gap: 14 }}>
                <button
                  type="button"
                  onClick={handleKidPlayNow}
                  disabled={kidBusy}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 16,
                    border: 'none',
                    background: kidBusy ? '#94a3b8' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: 16,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 10px 26px rgba(34,197,94,0.35)',
                    cursor: kidBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {kidBusy ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size={18} /> Starting...</span> : 'Play Now'}
                </button>
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, margin: 0 }}>
                  Guest account stays on this device until you sign out.
                </p>

                <div style={{ height: 1, background: 'rgba(148,163,184,0.25)' }} />

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
                    Create Account
                  </label>
                  <input
                    type="text"
                    placeholder="Pick a username"
                    value={kidName}
                    onChange={e => setKidName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '2px solid #cfe8ff',
                      background: '#f8fbff',
                      fontSize: 15,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleKidCreate}
                    disabled={kidCreateBusy}
                    style={{
                      width: '100%',
                      marginTop: 12,
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: 'none',
                      background: kidCreateBusy ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 14,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: kidCreateBusy ? 'not-allowed' : 'pointer',
                      boxShadow: '0 10px 24px rgba(14,165,233,0.35)',
                    }}
                  >
                    {kidCreateBusy ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size={16} /> Creating...</span> : 'Create Account'}
                  </button>
                </div>

                <div style={{ height: 1, background: 'rgba(148,163,184,0.25)' }} />

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
                    I Have a Username
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={kidSignInName}
                      onChange={e => setKidSignInName(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 190,
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: '2px solid #cfe8ff',
                        background: '#f8fbff',
                        fontSize: 15,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleKidSignIn}
                      disabled={kidSignInBusy}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: 'none',
                        background: kidSignInBusy ? '#94a3b8' : '#0f172a',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: 13,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: kidSignInBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                        {kidSignInBusy ? '...' : "Let's Go"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen">
          <div className="hidden md:flex flex-col items-center justify-center w-[42%] relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #1565c0 0%, #42a5f5 100%)' }}>
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <Fish size={60} className="text-white" />
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight">HandSpeak</h1>
              <p className="text-white/80 text-xl font-semibold">ASL Learning</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full">
              <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full h-24">
                <path fill="rgba(255,255,255,0.12)" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85C672,75,768,85,864,107C960,128,1056,160,1152,155C1248,149,1344,107,1392,85L1440,64L1440,180L0,180Z"/>
                <path fill="rgba(255,255,255,0.07)" d="M0,128L48,117C96,107,192,85,288,96C384,107,480,149,576,160C672,171,768,149,864,128C960,107,1056,85,1152,96C1248,107,1344,149,1392,171L1440,192L1440,180L0,180Z"/>
              </svg>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center bg-white px-10 py-12">
            <div className="flex md:hidden items-center gap-2 mb-10">
              <Fish size={32} className="text-[#1a73e8]" />
              <span className="text-3xl font-black text-[#1a2a3a]">HandSpeak</span>
            </div>

            <div className="w-full max-w-md">
              <h2 className="text-4xl font-black italic text-[#1a2a3a] mb-10">Sign In</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm mb-6 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Email</label>
                  <input
                    type="email" placeholder="your email here" value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: '2px solid #cce0f5', background: '#f8fbff', fontSize: 16, color: '#1a2a3a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#1a73e8'}
                    onBlur={e => e.target.style.borderColor = '#cce0f5'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="your password here" value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '16px 56px 16px 20px', borderRadius: 14, border: '2px solid #cce0f5', background: '#f8fbff', fontSize: 16, color: '#1a2a3a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#1a73e8'}
                      onBlur={e => e.target.style.borderColor = '#cce0f5'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90a4ae', display: 'flex', alignItems: 'center', padding: 4 }}>
                      {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: 3, width: 20, height: 20, flexShrink: 0, accentColor: '#1a73e8', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, color: '#546e7a', lineHeight: 1.6 }}>
                    I have read, understood and agreed to Handspeak's{' '}
                    <span style={{ color: '#1a73e8', fontWeight: 700, cursor: 'pointer' }}>EULA</span>
                    {' '}and{' '}
                    <span style={{ color: '#1a73e8', fontWeight: 700, cursor: 'pointer' }}>Privacy Policy</span>
                  </span>
                </label>

                <button type="submit"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '18px 0', borderRadius: 14, border: 'none', background: isLoading ? '#94a3b8' : '#1a73e8', color: 'white', fontSize: 16, fontWeight: 900, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: isLoading ? 'none' : '0 4px 18px rgba(26,115,232,0.4)', transition: 'box-shadow 0.2s', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { if(!isLoading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(26,115,232,0.6)' }}
                  onMouseLeave={e => { if(!isLoading) e.currentTarget.style.boxShadow = '0 4px 18px rgba(26,115,232,0.4)' }}
                >
                  {isLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8 }}><Spinner size={18} /> SIGNING IN...</span> : 'SIGN IN'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Forgot Password?
                  </button>
                  <Link to="/signup" style={{ fontSize: 14, fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
                    Create an Account
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700;800;900&family=Nunito:wght@700;800;900&display=swap');

        .kids-fish-r, .kids-fish-l {
          position: absolute;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .kids-fish-r {
          left: -80px;
          animation-name: kids-swim-right;
        }

        .kids-fish-l {
          right: -80px;
          transform: scaleX(-1);
          animation-name: kids-swim-left;
        }

        .kids-bubble {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.12);
          animation: kids-bubble-rise linear infinite;
        }

        @keyframes kids-swim-right {
          from { transform: translateX(-10%) }
          to { transform: translateX(120%) }
        }

        @keyframes kids-swim-left {
          from { transform: translateX(10%) scaleX(-1) }
          to { transform: translateX(-120%) scaleX(-1) }
        }

        @keyframes kids-bubble-rise {
          from { transform: translateY(0); opacity: 0.6; }
          to { transform: translateY(-120px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
