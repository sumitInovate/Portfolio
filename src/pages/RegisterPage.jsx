import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { runProfileAgent, runAvatarAgent } from '../utils/geminiAgents';
import { saveUserProfile, saveUserAvatar } from '../utils/userStorage';
import { SystemCursor } from '../components/layout/SystemCursor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (pw.length >= 8)                    score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))           score++;

  if (score <= 1) return { level: score, label: 'WEAK', class: 'weak' };
  if (score <= 2) return { level: score, label: 'MEDIUM', class: 'medium' };
  return          { level: score, label: 'STRONG', class: 'strong' };
}

// ─── Step 1: Credentials ─────────────────────────────────────────────────────

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
              {usernameStatus === 'checking'  && 'CHECKING AVAILABILITY…'}
              {usernameStatus === 'available' && 'USERNAME AVAILABLE ✓'}
              {usernameStatus === 'taken'     && `USERNAME TAKEN — ${usernameReason}`}
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
                    className={`strength-bar ${
                      i <= strength.level ? strength.class : ''
                    }`}
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
          <button type="button" onClick={() => window.history.back()}>
            SIGN IN ↗
          </button>
        </p>
      </form>
    </motion.div>
  );
}

// ─── Step 2: Profile Assets ───────────────────────────────────────────────────

function StepAssets({ credentials, onSubmit }) {
  const [photo,       setPhoto]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [resume,      setResume]      = useState(null);
  const [linkedin,    setLinkedin]    = useState('');
  const [formError,   setFormError]   = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
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
            {!photo ? (
              <>
                <div className="file-upload-icon">📸</div>
                <span className="file-upload-label">CLICK TO UPLOAD PHOTO</span>
                <span className="file-upload-hint">JPG, PNG or WEBP — used for RPG avatar generation</span>
              </>
            ) : (
              <div className="file-upload-name">
                ✓ {photo.name}
              </div>
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
            {!resume ? (
              <>
                <div className="file-upload-icon">📄</div>
                <span className="file-upload-label">CLICK TO UPLOAD RESUME</span>
                <span className="file-upload-hint">PDF, DOC or DOCX — AI will extract all profile data</span>
              </>
            ) : (
              <div className="file-upload-name">
                ✓ {resume.name}
              </div>
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

// ─── Processing Screen ────────────────────────────────────────────────────────

function ProcessingScreen({ registrationData, onComplete }) {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [alphaProgress, setAlphaProgress] = useState(0);
  const [alphaMessage,  setAlphaMessage]  = useState('Queued');
  const [alphaStatus,   setAlphaStatus]   = useState('pending'); // pending | active | completed

  const [betaProgress,  setBetaProgress]  = useState(0);
  const [betaMessage,   setBetaMessage]   = useState('Queued');
  const [betaStatus,    setBetaStatus]    = useState('pending');

  const [totalPercent,  setTotalPercent]  = useState(0);
  const [logs,          setLogs]          = useState(['[SYSTEM] Registration protocol initiated…']);
  const [phase,         setPhase]         = useState('auth'); // auth | alpha | beta | finalizing | done

  const addLog = useCallback((line, highlight = false) => {
    setLogs(prev => [...prev.slice(-3), { text: line, highlight }]);
  }, []);

  // ── Run the full registration pipeline ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { username, password, photo, resume, linkedin } = registrationData;

      try {
        // ── Phase 1: Sign Up (JWT + localStorage) ──────────────────────
        setPhase('auth');
        addLog('[AUTH] Creating account…');
        setTotalPercent(5);

        const signUpResult = await signUp({ username, password });
        if (!signUpResult.success) {
          addLog(`[ERROR] ${signUpResult.error}`, true);
          return;
        }
        addLog('[AUTH] Account created. JWT issued ✓', true);
        setTotalPercent(10);

        // ── Phase 2: Convert files to base64 ───────────────────────────
        addLog('[SYSTEM] Converting assets for processing…');
        const [resumeBase64, photoBase64] = await Promise.all([
          fileToBase64(resume),
          fileToBase64(photo),
        ]);
        setTotalPercent(15);

        // ── Phase 3: Agent Alpha — Profile ─────────────────────────────
        setPhase('alpha');
        setAlphaStatus('active');
        addLog('[AGENT ALPHA] Profile extraction protocol starting…');

        const profile = await runProfileAgent({
          resumeBase64,
          resumeMimeType: resume.type || 'application/pdf',
          linkedinUrl: linkedin,
          username,
          onProgress: ({ message, percent }) => {
            if (cancelled) return;
            setAlphaProgress(percent);
            setAlphaMessage(message);
            setTotalPercent(15 + Math.round(percent * 0.4));
            addLog(`[ALPHA] ${message}`);
          },
        });

        if (cancelled) return;
        setAlphaStatus('completed');
        setAlphaProgress(100);
        saveUserProfile(username, profile);
        addLog('[AGENT ALPHA] Profile data saved ✓', true);
        setTotalPercent(60);

        // ── Phase 4: Agent Beta — Avatar ───────────────────────────────
        setPhase('beta');
        setBetaStatus('active');
        addLog('[AGENT BETA] Avatar generation protocol starting…');

        const avatarDataUrl = await runAvatarAgent({
          photoBase64,
          photoMimeType: photo.type || 'image/jpeg',
          onProgress: ({ message, percent }) => {
            if (cancelled) return;
            setBetaProgress(percent);
            setBetaMessage(message);
            setTotalPercent(60 + Math.round(percent * 0.35));
            addLog(`[BETA] ${message}`);
          },
        });

        if (cancelled) return;
        setBetaStatus('completed');
        setBetaProgress(100);

        // Save avatar — inject into profile too
        saveUserAvatar(username, avatarDataUrl);
        profile.meta.avatarUrl = avatarDataUrl;
        saveUserProfile(username, profile);
        addLog('[AGENT BETA] RPG avatar saved ✓', true);
        setTotalPercent(97);

        // ── Phase 5: Finalize ───────────────────────────────────────────
        setPhase('finalizing');
        addLog('[SYSTEM] Finalizing hunter profile…');
        await new Promise(r => setTimeout(r, 800));
        setTotalPercent(100);

        addLog('[SYSTEM] PROFILE ONLINE — ACCESS GRANTED ✓', true);
        setPhase('done');

        await new Promise(r => setTimeout(r, 1000));
        if (!cancelled) navigate(`/${username}`);

      } catch (err) {
        if (!cancelled) {
          console.error('[ProcessingScreen]', err);
          addLog(`[ERROR] ${err.message}`, true);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = {
    auth:        'AUTHENTICATING…',
    alpha:       'PROFILE EXTRACTION RUNNING…',
    beta:        'AVATAR GENERATION RUNNING…',
    finalizing:  'FINALIZING PROFILE…',
    done:        'REGISTRATION COMPLETE ✓',
  }[phase] ?? '…';

  return (
    <motion.div
      className="processing-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Ambient orbs */}
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

        {/* Overall percent */}
        <div className="processing-percent">{totalPercent}%</div>

        {/* Overall progress bar */}
        <div className="processing-progress-outer">
          <div
            className="processing-progress-fill"
            style={{ width: `${totalPercent}%` }}
          />
          <div className="processing-progress-shimmer" />
        </div>

        {/* Agent panels */}
        <div className="processing-agents">
          {/* Agent Alpha */}
          <div className={`agent-panel ${alphaStatus}`}>
            <div className="agent-panel-header">
              <span className="agent-panel-name">
                {alphaStatus === 'completed' ? '✓' : alphaStatus === 'active' ? '⚡' : '○'}&nbsp;
                AGENT ALPHA — PROFILE EXTRACTOR
              </span>
              <span className={`agent-status-badge ${alphaStatus === 'completed' ? 'done' : alphaStatus === 'active' ? 'running' : 'pending'}`}>
                {alphaStatus === 'completed' ? 'DONE' : alphaStatus === 'active' ? 'RUNNING' : 'PENDING'}
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

          {/* Agent Beta */}
          <div className={`agent-panel ${betaStatus}`}>
            <div className="agent-panel-header">
              <span className="agent-panel-name">
                {betaStatus === 'completed' ? '✓' : betaStatus === 'active' ? '⚡' : '○'}&nbsp;
                AGENT BETA — RPG AVATAR GENERATOR
              </span>
              <span className={`agent-status-badge ${betaStatus === 'completed' ? 'done' : betaStatus === 'active' ? 'running' : 'pending'}`}>
                {betaStatus === 'completed' ? 'DONE' : betaStatus === 'active' ? 'RUNNING' : 'PENDING'}
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

        {/* Log stream */}
        <div className="processing-log" aria-live="polite">
          {logs.map((log, i) => (
            <span
              key={i}
              className={`processing-log-line ${(log.highlight || (typeof log === 'string' && false)) ? 'highlight' : ''}`}
              style={{ color: log.highlight ? 'var(--color-system-400)' : undefined }}
            >
              {typeof log === 'string' ? log : log.text}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ currentStep }) {
  return (
    <div className="register-step-bar" aria-label="Registration steps">
      {[1, 2].map((step, i) => (
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

// ─── Main Register Page ────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step,               setStep]               = useState(1);   // 1 | 2
  const [credentials,        setCredentials]        = useState(null);
  const [registrationData,   setRegistrationData]   = useState(null);
  const [showProcessing,     setShowProcessing]     = useState(false);

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

      {/* Background */}
      <div className="register-bg" aria-hidden="true">
        <div className="register-orb register-orb--a" />
        <div className="register-orb register-orb--b" />
      </div>
      <div className="landing-grid" aria-hidden="true" />

      {/* Top bar */}
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

      {/* Main card */}
      <div className="register-root">
        <AnimatePresence mode="wait">
          {!showProcessing ? (
            <motion.div
              key="register-card"
              className="register-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step indicator */}
              <StepBar currentStep={step} />

              {/* Steps */}
              <AnimatePresence mode="wait">
                {step === 1 && <StepCredentials key="s1" onNext={handleStep1} />}
                {step === 2 && <StepAssets key="s2" credentials={credentials} onSubmit={handleStep2} />}
              </AnimatePresence>
            </motion.div>
          ) : (
            <ProcessingScreen
              key="processing"
              registrationData={registrationData}
              onComplete={() => {}}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
