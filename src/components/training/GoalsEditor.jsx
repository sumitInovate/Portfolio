import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHunterStore } from '../../stores/hunterStore';
import { hunterStorage } from '../../utils/training/hunterStorage';
import { runBadgeAgent } from '../../utils/training/badgeAgent';

const CATEGORIES = [
  { key: 'technology', label: 'TECHNOLOGIES', placeholder: 'e.g., Kubernetes, TypeScript' },
  { key: 'domain', label: 'DOMAINS', placeholder: 'e.g., FinTech, Distributed Systems' },
  { key: 'skill', label: 'SKILLS', placeholder: 'e.g., System Design, Mentoring' },
  { key: 'designation', label: 'DESIGNATIONS', placeholder: 'e.g., Tech Lead, CTO' },
  { key: 'subject', label: 'SUBJECTS', placeholder: 'e.g., Machine Learning, Security' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'HIGH', color: '#FF4444' },
  { value: 2, label: 'MED', color: '#FFD700' },
  { value: 3, label: 'LOW', color: '#7BA8D0' },
];

/**
 * GoalsEditor — user configures their learning goals
 * When goals are saved, triggers the Badge Agent to generate new missions
 */
export function GoalsEditor({ username: _username }) {
  const profile = useHunterStore(s => s.profile);
  const goals = useHunterStore(s => s.goals);
  const addGoal = useHunterStore(s => s.addGoal);
  const removeGoal = useHunterStore(s => s.removeGoal);
  const setGoals = useHunterStore(s => s.setGoals);
  const setBadges = useHunterStore(s => s.setBadges);
  const setAgentRunning = useHunterStore(s => s.setAgentRunning);
  const setLastAgentRun = useHunterStore(s => s.setLastAgentRun);
  const setAgentError = useHunterStore(s => s.setAgentError);
  const addToast = useHunterStore(s => s.addToast);

  const [addingFor, setAddingFor] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [newPriority, setNewPriority] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const handleAddGoal = (category) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;

    const goal = {
      id: Math.random().toString(36).substring(7),
      category,
      value: trimmed,
      priority: newPriority,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    hunterStorage.addGoal(profile.username, goal);
    addGoal(goal);
    setNewValue('');
    setAddingFor(null);
    setIsDirty(true);
  };

  const handleRemoveGoal = (goalId) => {
    hunterStorage.removeGoal(profile.username, goalId);
    removeGoal(goalId);
    setIsDirty(true);
  };

  const handleSaveAndRunAgent = async () => {
    const latestGoals = hunterStorage.getHunterGoals(profile.username);
    setGoals(latestGoals);

    const activeGoals = latestGoals.filter(g => g.is_active);
    if (activeGoals.length === 0) {
      addToast({
        type: 'error',
        message: 'Add at least one active goal before generating missions.',
      });
      return;
    }

    setSaving(true);
    setIsDirty(false);
    setAgentRunning(true);
    setAgentError(null);

    try {
      const generatedBadges = await runBadgeAgent({
        profile,
        goals: activeGoals,
      });

      hunterStorage.saveHunterBadges(profile.username, generatedBadges);
      setBadges(generatedBadges);
      setLastAgentRun(new Date().toISOString());

      hunterStorage.recordAgentRun(profile.username, {
        trigger: 'goals_changed',
        badgesGenerated: generatedBadges.length,
      });

      addToast({
        type: 'success',
        message: `⚡ System updated — ${generatedBadges.length} new missions generated`,
      });
    } catch (err) {
      console.error('Agent error:', err);
      setAgentError(err?.message || 'Mission generation failed');
      addToast({
        type: 'error',
        message: 'Mission generation failed. Please retry.',
      });
      setIsDirty(true);
    } finally {
      setSaving(false);
      setAgentRunning(false);
    }
  };

  return (
    <div className="system-panel goals-editor">
      <div className="goals-editor__header">
        <h2 className="panel-title">HUNTER GOALS & INTERESTS</h2>
        <p className="panel-subtitle">
          Configure your path. The System adapts your missions to your ambitions.
        </p>
      </div>

      <div className="goals-grid">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="goals-category">
            <span className="goals-category__label">{cat.label}</span>
            <div className="goals-category__chips">
              {/* Existing goal chips */}
              <AnimatePresence>
                {goals
                  .filter(g => g.category === cat.key && g.is_active)
                  .map(goal => (
                    <motion.span
                      key={goal.id}
                      className={`goal-chip goal-chip--p${goal.priority}`}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      layout
                    >
                      {goal.value}
                      <button
                        className="goal-chip__remove"
                        onClick={() => handleRemoveGoal(goal.id)}
                        aria-label={`Remove ${goal.value}`}
                        title="Remove goal"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
              </AnimatePresence>

              {/* Inline add input */}
              <AnimatePresence mode="wait">
                {addingFor === cat.key ? (
                  <motion.div
                    className="goal-add-row"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    <input
                      autoFocus
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddGoal(cat.key);
                        if (e.key === 'Escape') {
                          setAddingFor(null);
                          setNewValue('');
                        }
                      }}
                      placeholder={cat.placeholder}
                      className="goal-add-input"
                      maxLength={60}
                    />
                    {/* Priority selector */}
                    <div className="goal-priority-row">
                      {PRIORITY_OPTIONS.map(p => (
                        <button
                          key={p.value}
                          className={`priority-btn ${newPriority === p.value ? 'priority-btn--active' : ''}`}
                          style={{ '--p-color': p.color }}
                          onClick={() => setNewPriority(p.value)}
                          type="button"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <button
                      className="goal-add-confirm"
                      onClick={() => handleAddGoal(cat.key)}
                      type="button"
                    >
                      ADD ✓
                    </button>
                  </motion.div>
                ) : (
                  <button
                    className="goal-chip goal-chip--add"
                    onClick={() => setAddingFor(cat.key)}
                    type="button"
                  >
                    + ADD
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Save row — visible when dirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            className="goals-save-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <span className="goals-save-hint">⚡ Goals updated — save to regenerate your missions</span>
            <button
              className="glow-btn"
              onClick={handleSaveAndRunAgent}
              disabled={saving}
              type="submit"
            >
              {saving ? 'SYSTEM PROCESSING...' : 'SAVE & UPDATE MISSIONS'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
