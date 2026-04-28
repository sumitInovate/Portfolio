import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useHunterStore } from '../stores/hunterStore';
import { hunterStorage } from '../utils/training/hunterStorage';
import { Navigation } from '../components/layout/Navigation';
import { LoadingScreen } from '../components/layout/LoadingScreen';
import { HunterStatsBar } from '../components/training/HunterStatsBar';
import { GoalsEditor } from '../components/training/GoalsEditor';
import { ActiveMissions } from '../components/training/ActiveMissions';
import { CompletedVault } from '../components/training/CompletedVault';

import '../styles/training.css';

export default function Training() {
  const navigate = useNavigate();
  const { authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, userLoading, fetchUser } = useUser();
  const profile = useHunterStore(s => s.profile);
  const setProfile = useHunterStore(s => s.setProfile);
  const setBadges = useHunterStore(s => s.setBadges);
  const setGoals = useHunterStore(s => s.setGoals);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser?.username) {
      navigate('/');
      return;
    }
    fetchUser(authUser.username);
  }, [authLoading, isAuthenticated, authUser?.username, fetchUser, navigate]);

  useEffect(() => {
    if (!userData?.meta?.username) return;

    const hunterUsername = userData.meta.username;

    const profile = hunterStorage.upsertHunterProfileFromPortfolio(hunterUsername, {
      resume_summary: userData?.about?.bio?.[0] || 'Full Stack Developer',
      current_role: userData?.hero?.role || 'Software Engineer',
      current_company: userData?.experience?.[0]?.guild || '',
      level: userData?.hero?.level ?? 1,
      class: userData?.hero?.rank ?? 'E',
      xp_current: userData?.hero?.xp?.current ?? 0,
      xp_to_next: userData?.hero?.xp?.max ?? 10000,
      years_exp: 0,
    });

    setProfile(profile);

    const badges = hunterStorage.getHunterBadges(hunterUsername);
    const goals = hunterStorage.getHunterGoals(hunterUsername);

    setBadges(badges);
    setGoals(goals);
  }, [userData, setProfile, setBadges, setGoals]);

  if (authLoading || userLoading || !profile) {
    return <LoadingScreen />;
  }

  return (
    <div className="training-page">
      <Navigation />

      <main className="training-main">
        <section className="training-section" id="stats">
          <div className="section-header">
            <span className="section-tag">{'// HUNTER STATUS'}</span>
            <h1 className="section-title">ADVANCEMENT TRACKER</h1>
          </div>
          <HunterStatsBar username={profile.username} />
        </section>

        <section className="training-section" id="goals" style={{ marginTop: '48px' }}>
          <div className="section-header">
            <span className="section-tag">{'// GOALS & INTERESTS'}</span>
            <h2 className="section-title">CONFIGURE YOUR PATH</h2>
          </div>
          <GoalsEditor username={profile.username} />
        </section>

        <section className="training-section" id="missions" style={{ marginTop: '48px' }}>
          <div className="section-header">
            <span className="section-tag">{'// ACTIVE MISSIONS'}</span>
            <h2 className="section-title">BADGE TRAINING GROUND</h2>
          </div>
          <ActiveMissions />
        </section>

        <section className="training-section" id="vault" style={{ marginTop: '48px', marginBottom: '64px' }}>
          <div className="section-header">
            <span className="section-tag">{'// COMPLETED BADGES'}</span>
            <h2 className="section-title">BADGE VAULT</h2>
          </div>
          <CompletedVault />
        </section>
      </main>
    </div>
  );
}
