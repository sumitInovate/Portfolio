import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { runProfileAgent, runAvatarAgent } from '../utils/geminiAgents';
import { saveUserProfile, saveUserAvatar, rollbackUserRegistration } from '../utils/userStorage';
import { SystemCursor } from '../components/layout/SystemCursor';

// — Helpers —

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the Data URL prefix → pure base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', class: '' };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/\d/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { level: score, label: 'WEAK',   class: 'weak' };
  if (score <= 2) return { level: score, label: 'MEDIUM', class: 'medium' };
  return              { level: score, label: 'STRONG', class: 'strong' };
}

// — Step 1: Credentials —

function StepCredentials({ onNext }) {
  const { checkUsername } = useAuth();
  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameStatus,  setUsernameStatus]  = useState(null); // null | 'checking' | 'available' | 'taken'
  const [usernameReason,  setUsernameReason]  = useState('');
  const [formError,       setFormError]       = useState('');
  const debounceRef = useRef(null);

  const strength = getPasswordStrength(password);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(val);
    setUsernameStatus('checking');
    setUsernameReason('');

    clearTimeout(debounceRef.current);
    if (val.length < 3) {
      setUsernameStatus(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const result = await checkUsername(val);
      setUsernameStatus(result.available ? 'available' : 'taken');
      setUsernameReason(result.reason ?? '');
    }, 400);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!username || username.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (usernameStatus !== 'available') {
      setFormError('Please choose an available username.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    onNext({ username, password });
  };

  const inputClass = (status) =>
    status === 'available' ? 'register-input input-valid' :
    status === 'taken'     ? 'register-input input-error' :
    'register-input';

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="register-header">
        <span className="register-eyebrow">STEP 01 OF 02</span>
        <h2 className="register-title">CREATE CREDENTIALS</h2>
        <p className="register-subtitle">
          Choose a unique username — this becomes your portfolio URL:<br/>
          <span style={{ color: 'var(--color-system-400)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            codeaether.vercel.app/<strong>{username || 'your-name'}</strong>
          </span>
        </p>
      </div>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        {/* Username */}
        <div className="register-field">
          <label className="register-label" htmlFor="reg-username">USERNAME</label>
          <input
            id="reg-username"
            className={inputClass(usernameStatus)}
            placeholder="e.g. john-doe"
            value={username}
            onChange={handleUsernameChange}
            autoComplete="username"
            autoFocus
            spellCheck={false}
            maxLength={30}
          />
          {/* Availability indicator */}
          {username.length >= 3 && (
            <div className={`username-status ${usernameStatus ?? ''}`}>
              <span className="username-status-dot" />
              {usernameStatus === 'checking'  && 'CHECKING AVAILABILITY...'}
              {usernameStatus === 'available' && 'USERNAME AVAILABLE'}
              {usernameStatus === 'taken'     && `USERNAME TAKEN ${usernameReason}`}
            </div>
          )}
        </div>

        {/* Password */}
        <div className="register-field">
          <label className="register-label" htmlFor="reg-password">PASSWORD</label>
          <input
            id="reg-password"
            type="password"
            className="register-input"
            placeholder="Min. 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {password && (
            <>
              <div className="password-strength">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`strength-bar ${i <= strength.level ? strength.class : ''}`}
                  />
                ))}
              </div>
              <span className={`password-strength-label ${strength.class}`}>
                {strength.label}
              </span>
            </>
          )}
        </div>

        {/* Confirm Password */}
        <div className="register-field">
          <label className="register-label" htmlFor="reg-confirm">CONFIRM PASSWORD</label>
          <input
            id="reg-confirm"
            type="password"
            className={`register-input ${
              confirmPassword && confirmPassword !== password ? 'input-error' :
              confirmPassword && confirmPassword === password ? 'input-valid' : ''
            }`}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {formError && (
          <div className="register-error" role="alert">⚠ {formError}</div>
        )}

        <button
          type="submit"
          className="register-submit-btn"
          disabled={usernameStatus !== 'available' || !password || !confirmPassword}
        >
          CONTINUE →
        </button>

        <p className="register-signin-link">
          Already have an account?{' '}
          <button type="button" onClick={() => globalThis.history.back()}>
            SIGN IN ↗
          </button>
        </p>
      </form>
    </motion.div>
  );
}

// — Step 2: Profile Assets —

function StepAssets({ credentials, onSubmit }) {
  const [photo,        setPhoto]        = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [resume,       setResume]       = useState(null);
  const [linkedin,     setLinkedin]     = useState('');
  const [formError,    setFormError]    = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setResume(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!photo) {
      setFormError('A profile photo is required for RPG avatar generation.');
      return;
    }
    if (!resume) {
      setFormError('Your resume is required to build your profile.');
      return;
    }

    onSubmit({ ...credentials, photo, resume, linkedin });
  };

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="register-header">
        <span className="register-eyebrow">STEP 02 OF 02</span>
        <h2 className="register-title">UPLOAD ASSETS</h2>
        <p className="register-subtitle">
          Our AI agents will extract your full profile from your resume and generate an RPG avatar from your photo.
        </p>
      </div>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        {/* Profile Photo */}
        <div className="register-field">
          <label className="register-label">
            PROFILE PHOTO
            <span style={{ fontSize: '9px', color: 'var(--color-system-400)', letterSpacing: '1px' }}>REQUIRED</span>
          </label>

          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="avatar-preview" />
          )}

          <div className={`file-upload-area ${photo ? 'has-file' : ''}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              id="reg-photo-input"
            />
            {photo ? (
              <div className="file-upload-name">
                ✓ {photo.name}
              </div>
            ) : (
              <>
                <div className="file-upload-icon">📂</div>
                <span className="file-upload-label">CLICK TO UPLOAD PHOTO</span>
                <span className="file-upload-hint">JPG, PNG or WEBP — used for RPG avatar generation</span>
              </>
            )}
          </div>
        </div>

        {/* Resume */}
        <div className="register-field">
          <label className="register-label">
            RESUME / CV
            <span style={{ fontSize: '9px', color: 'var(--color-system-400)', letterSpacing: '1px' }}>REQUIRED</span>
          </label>
          <div className={`file-upload-area ${resume ? 'has-file' : ''}`}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              id="reg-resume-input"
            />
            {resume ? (
              <div className="file-upload-name">
                ✓ {resume.name}
              </div>
            ) : (
              <>
                <div className="file-upload-icon">📄</div>
                <span className="file-upload-label">CLICK TO UPLOAD RESUME</span>
                <span className="file-upload-hint">PDF, DOC or DOCX — AI will extract all profile data</span>
              </>
            )}
          </div>
        </div>

        {/* LinkedIn */}
        <div className="register-field">
          <label className="register-label" htmlFor="reg-linkedin">
            LINKEDIN PROFILE URL
            <span className="register-label-optional">OPTIONAL</span>
          </label>
          <input
            id="reg-linkedin"
            type="url"
            className="register-input"
            placeholder="https://linkedin.com/in/your-name"
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
            autoComplete="url"
          />
        </div>

        {formError && (
          <div className="register-error" role="alert">⚠ {formError}</div>
        )}

        <button type="submit" className="register-submit-btn">
          INITIATE REGISTRATION →
        </button>
      </form>
    </motion.div>
  );
}


function ProcessingScreen({ registrationData }) {
  const { signUp } = useAuth();
  const navigate   = useNavigate();
  const hasStartedRef = useRef(false);
  const logCounterRef = useRef(0);

  const [alphaProgress, setAlphaProgress] = useState(0);
  const [alphaMessage,  setAlphaMessage]  = useState('Queued');
  const [alphaStatus,   setAlphaStatus]   = useState('pending');

  const [betaProgress,  setBetaProgress]  = useState(0);
  const [betaMessage,   setBetaMessage]   = useState('Queued');
  const [betaStatus,    setBetaStatus]    = useState('pending');

  const [totalPercent,  setTotalPercent]  = useState(0);
  const [logs,          setLogs]          = useState([{ id: 0, text: '[SYSTEM] Registration protocol initiated...', highlight: false }]);
  const [phase,         setPhase]         = useState('auth');
  const [errorMessage,  setErrorMessage]  = useState('');
  const [errorDetails,  setErrorDetails]  = useState('');

  const addLog = useCallback((line, highlight = false) => {
    const logId = ++logCounterRef.current;
    setLogs(prev => [...prev.slice(-3), { id: logId, text: line, highlight }]);
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;
    let currentPhase = 'auth';

    const updatePhase = (nextPhase) => {
      currentPhase = nextPhase;
      setPhase(nextPhase);
    };

    async function run() {
      const { username, password, photo, resume, linkedin } = registrationData;

      try {
        // — Phase 1: Sign Up (JWT + localStorage) —
        updatePhase('auth');
        addLog('[AUTH] Creating account...');
        setTotalPercent(5);

        const signUpResult = await signUp({ username, password });
        if (!signUpResult.success) {
          addLog(`[ERROR] ${signUpResult.error}`, true);
          throw new Error(signUpResult.error);
        }
        addLog('[AUTH] Account created. JWT issued.', true);
        setTotalPercent(10);

        // — Phase 2: Convert files to base64 —
        updatePhase('processing');
        addLog('[SYSTEM] Converting assets for processing...');
        const [resumeBase64, photoBase64] = await Promise.all([
          fileToBase64(resume),
          fileToBase64(photo),
        ]);
        setTotalPercent(15);

        // — Phase 3: Agent Alpha — profile extraction —
        updatePhase('agents');
        setAlphaStatus('active');
        setAlphaMessage('Initializing profile extraction protocol...');
        addLog('[AGENT ALPHA] Profile extraction protocol starting...');

        const runAgentWithSelfRetry = async ({
          agentLabel,
          execute,
          setStatus,
          setMessage,
          setProgress,
          onCompletedMessage,
          onCompletedLog,
        }) => {
          let attempt = 1;

          while (!cancelled) {
            try {
              const value = await execute(attempt);

              if (cancelled) {
                throw new Error('Registration cancelled');
              }

              setStatus('completed');
              setProgress(100);
              setMessage(onCompletedMessage);
              addLog(onCompletedLog, true);

              return value;
            } catch (reason) {
              if (cancelled) {
                throw reason;
              }

              const errorText = reason?.message || `${agentLabel} failed`;
              const delayMs = Math.min(30000, 1500 * Math.pow(2, Math.max(0, attempt - 1)));
              const waitSecs = Math.max(1, Math.round(delayMs / 1000));

              setStatus('active');
              setMessage(`Attempt ${attempt} failed. Retrying in ${waitSecs}s...`);
              addLog(`[${agentLabel}] ${errorText}. Retrying in ${waitSecs}s...`, true);

              let remaining = delayMs;
              while (remaining > 0) {
                if (cancelled) {
                  throw new Error('Registration cancelled');
                }
                const nextDelay = Math.min(250, remaining);
                await new Promise(r => setTimeout(r, nextDelay));
                remaining -= nextDelay;
              }

              attempt += 1;
            }
          }

          throw new Error('Registration cancelled');
        };

        const profile = await runAgentWithSelfRetry({
          agentLabel: 'AGENT ALPHA',
          execute: (attempt) => runProfileAgent({
            resumeBase64,
            resumeMimeType: resume.type || 'application/pdf',
            linkedinUrl: linkedin,
            username,
            onProgress: ({ message, percent }) => {
              if (cancelled) return;
              setAlphaProgress(percent);
              setAlphaMessage(attempt > 1 ? `Attempt ${attempt}: ${message}` : message);
              setTotalPercent(15 + Math.round(percent * 0.4));
              addLog(`[ALPHA] ${message}`);
            },
          }),
          setStatus: setAlphaStatus,
          setMessage: setAlphaMessage,
          setProgress: setAlphaProgress,
          onCompletedMessage: 'Profile extraction complete.',
          onCompletedLog: '[AGENT ALPHA] Profile data extracted [OK]',
        });

        if (cancelled) return;
        setTotalPercent(55);

        // — Phase 4: Agent Beta — avatar generation —
        setBetaStatus('active');
        setBetaMessage('Initializing avatar generation protocol...');
        addLog('[AGENT BETA] Avatar generation protocol starting...');

        const avatarDataUrl = await runAgentWithSelfRetry({
          agentLabel: 'AGENT BETA',
          execute: (attempt) => runAvatarAgent({
            photoBase64,
            photoMimeType: photo.type || 'image/jpeg',
            onProgress: ({ message, percent }) => {
              if (cancelled) return;
              setBetaProgress(percent);
              setBetaMessage(attempt > 1 ? `Attempt ${attempt}: ${message}` : message);
              setTotalPercent(55 + Math.round(percent * 0.4));
              addLog(`[BETA] ${message}`);
            },
          }),
          setStatus: setBetaStatus,
          setMessage: setBetaMessage,
          setProgress: setBetaProgress,
          onCompletedMessage: 'Avatar generation complete.',
          onCompletedLog: '[AGENT BETA] RPG avatar generated.',
        });

        if (cancelled) return;

        profile.meta.avatarUrl = avatarDataUrl;

        try {
          await Promise.all([
            Promise.resolve(saveUserProfile(username, profile)),
            saveUserAvatar(username, avatarDataUrl),
          ]);
          addLog('[AGENT BETA] RPG avatar saved.', true);
          addLog('[SYSTEM] Complete profile saved to storage.', true);
        } catch (storageErr) {
          throw new Error(`Failed to save profile: ${storageErr.message}`);
        }
        setTotalPercent(97);

        // — Phase 5: Finalize —
        updatePhase('finalizing');
        addLog('[SYSTEM] Finalizing hunter profile...');
        await new Promise(r => setTimeout(r, 800));
        setTotalPercent(100);

        addLog('[SYSTEM] PROFILE ONLINE — ACCESS GRANTED.', true);
        updatePhase('done');

        await new Promise(r => setTimeout(r, 1000));
        if (!cancelled) navigate(`/${username}`);

      } catch (err) {
        if (!cancelled) {
          console.error('[ProcessingScreen]', err);

          const errorMsg = err.message || 'Unknown error occurred during registration';

          if (currentPhase !== 'auth') {
            try {
              rollbackUserRegistration(registrationData?.username);
              addLog('[SYSTEM] Rolled back partial registration for ' + registrationData?.username, true);
            } catch (rollbackErr) {
              console.error('[ProcessingScreen] rollback failed', rollbackErr);
            }
          }

          if (currentPhase === 'agents') {
            setAlphaStatus(prev => (prev === 'active' || prev === 'pending' ? 'failed' : prev));
            setBetaStatus(prev => (prev === 'active' || prev === 'pending' ? 'failed' : prev));
          }

          let userMessage = errorMsg;
          if (errorMsg.includes('Profile Extraction Failed')) {
            userMessage = '⚠️ Profile Extraction Failed\n\nYour resume could not be processed. This may be due to:\n• Invalid resume format\n• API quota exceeded\n• Network issues\n\nPlease try again.';
          } else if (errorMsg.includes('quota')) {
            userMessage = '⚠️ API quota exceeded\n\nThe AI service is temporarily unavailable. Please try again in a few minutes.';
          } else if (errorMsg.includes('localStorage')) {
            userMessage = '⚠️ Storage error\n\nCould not save profile to browser storage. Try regular (non-incognito) mode.';
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            userMessage = '⚠️ Network error\n\nCheck your internet connection and try again.';
          }

          updatePhase('error');
          setErrorMessage(userMessage);
          setErrorDetails(errorMsg);
          addLog(`[ERROR] ${errorMsg}`, true);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = {
    auth:       'AUTHENTICATING...',
    processing: 'PROCESSING ASSETS...',
    agents:     'RUNNING AI AGENTS...',
    finalizing: 'FINALIZING PROFILE...',
    done:       'REGISTRATION COMPLETE',
    error:      'REGISTRATION FAILED',
  }[phase] ?? '...';

  const agentIcon  = (s) => s === 'completed' ? '✓' : s === 'active' ? '▸' : s === 'failed' ? '✕' : '○';
  const agentBadge = (s) => s === 'completed' ? 'done' : s === 'active' ? 'running' : s === 'failed' ? 'failed' : 'pending';
  const agentLabel = (s) => s === 'completed' ? 'DONE' : s === 'active' ? 'RUNNING' : s === 'failed' ? 'FAILED' : 'PENDING';

  return (
    <motion.div
      className="processing-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="processing-screen-bg" aria-hidden="true">
        <div className="processing-orb processing-orb--a" />
        <div className="processing-orb processing-orb--b" />
      </div>

      <div className="processing-content">
        <span className="processing-eyebrow">SYSTEM PROCESSING</span>
        <h1 className="processing-title">
          {phase === 'done' ? 'PROFILE ONLINE' : 'HUNTER AWAKENING'}
        </h1>
        <p className="processing-subtitle">{statusLabel}</p>

        <div className="processing-percent">{totalPercent}%</div>

        <div className="processing-progress-outer">
          <div
            className="processing-progress-fill"
            style={{ width: `${totalPercent}%` }}
          />
          <div className="processing-progress-shimmer" />
        </div>

        {phase === 'error' && (
          <motion.div
            className="processing-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'rgba(255, 100, 100, 0.1)',
              border: '2px solid var(--color-system-400)',
              borderRadius: '4px',
              padding: '16px 20px',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontSize: '13px',
              color: 'var(--color-system-300)',
              fontFamily: 'var(--font-system)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-system-400)' }}>
              {errorMessage.split('\n')[0]}
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', opacity: 0.9 }}>
              {errorMessage.split('\n').slice(1).join('\n')}
            </div>
            {errorDetails && (
              <details style={{ marginTop: '12px', cursor: 'pointer', fontSize: '11px', opacity: 0.7 }}>
                <summary style={{ marginBottom: '4px' }}>Technical Details</summary>
                <code style={{ display: 'block', overflow: 'auto', maxHeight: '80px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '2px', marginTop: '8px' }}>
                  {errorDetails}
                </code>
              </details>
            )}
          </motion.div>
        )}

        <div className="processing-agents">
          <div className={`agent-panel ${alphaStatus}`}>
            <div className="agent-panel-header">
              <span className="agent-panel-name">
                {agentIcon(alphaStatus)}&nbsp;AGENT ALPHA — PROFILE EXTRACTOR
              </span>
              <span className={`agent-status-badge ${agentBadge(alphaStatus)}`}>
                {agentLabel(alphaStatus)}
              </span>
            </div>
            <div className="agent-message">{alphaMessage}</div>
            <div className="agent-panel-progress">
              <div
                className="agent-panel-progress-fill"
                style={{ width: `${alphaProgress}%` }}
              />
            </div>
          </div>

          <div className={`agent-panel ${betaStatus}`}>
            <div className="agent-panel-header">
              <span className="agent-panel-name">
                {agentIcon(betaStatus)}&nbsp;AGENT BETA — RPG AVATAR GENERATOR
              </span>
              <span className={`agent-status-badge ${agentBadge(betaStatus)}`}>
                {agentLabel(betaStatus)}
              </span>
            </div>
            <div className="agent-message">{betaMessage}</div>
            <div className="agent-panel-progress">
              <div
                className="agent-panel-progress-fill"
                style={{ width: `${betaProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="processing-log" aria-live="polite">
          {logs.map((log) => (
            <span
              key={log.id ?? log.text}
              className={`processing-log-line ${log.highlight ? 'highlight' : ''}`}
              style={{ color: log.highlight ? 'var(--color-system-400)' : undefined }}
            >
              {log.text}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// — Step Indicator —

function StepBar({ currentStep }) {
  return (
    <div className="register-step-bar" aria-label="Registration steps">
      {[1, 2].map((step) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: step < 2 ? 1 : 0 }}>
          <div className={`register-step-dot ${
            currentStep > step ? 'completed' :
            currentStep === step ? 'active' : ''
          }`}>
            {currentStep > step ? '✓' : step}
          </div>
          {step < 2 && (
            <div className={`register-step-line ${currentStep > step ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// — Main Register Page —

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step,             setStep]             = useState(1);
  const [credentials,      setCredentials]      = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [showProcessing,   setShowProcessing]   = useState(false);

  const handleStep1 = useCallback((creds) => {
    setCredentials(creds);
    setStep(2);
  }, []);

  const handleStep2 = useCallback((data) => {
    setRegistrationData(data);
    setShowProcessing(true);
  }, []);

  return (
    <>
      <SystemCursor />

      <div className="register-bg" aria-hidden="true">
        <div className="register-orb register-orb--a" />
        <div className="register-orb register-orb--b" />
      </div>
      <div className="landing-grid" aria-hidden="true" />

      <header className="register-topbar">
        <a href="/" className="landing-logo" aria-label="CodeAether home" style={{ textDecoration: 'none' }}>
          <div className="landing-logo-mark">CA</div>
          <span className="landing-logo-text">Code<span>Aether</span></span>
        </a>
        <button
          className="register-back-btn"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          ← BACK TO HOME
        </button>
      </header>

      <div className="register-root">
        <AnimatePresence mode="wait">
          {showProcessing ? (
            <ProcessingScreen
              key="processing"
              registrationData={registrationData}
            />
          ) : (
            <motion.div
              key="register-card"
              className="register-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepBar currentStep={step} />

              <AnimatePresence mode="wait">
                {step === 1 && <StepCredentials key="s1" onNext={handleStep1} />}
                {step === 2 && <StepAssets key="s2" credentials={credentials} onSubmit={handleStep2} />}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
