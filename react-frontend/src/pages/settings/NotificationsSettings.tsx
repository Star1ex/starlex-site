import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { userService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { NotificationPreferences } from '@/types/dto.js';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="settings-row">
      <div className="min-w-0">
        <p className="settings-row-title">{label}</p>
        <p className="settings-row-description">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className="settings-toggle disabled:opacity-40"
        data-checked={checked}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}

export const NotificationsSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_on_assign: true,
    email_on_mention: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    userService.getNotificationPreferences()
      .then(p => { if (!cancelled) setPrefs(p); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setError('');
    try {
      await userService.updateNotificationPreferences({ [key]: value });
      showToast('Preferences saved', 'success');
    } catch {
      setPrefs(prefs);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page animate-pulse">
        {[0, 1].map(i => <div key={i} className="h-14 rounded-xl bg-white/4" />)}
      </div>
    );
  }

  return (
    <div className="settings-page">
      <section className="settings-section">
        <div className="settings-section-header flex items-center gap-3">
          <span className="settings-row-icon">
            <Bell size={16} />
          </span>
          <div>
            <h3 className="settings-section-title">Email notifications</h3>
            <p className="settings-section-description">
              Choose which workspace updates should reach your inbox.
            </p>
          </div>
        </div>

        {error && <p className="settings-message settings-message--error mb-3">{error}</p>}

        <div className="space-y-3">
          <ToggleRow
            label="Task assigned"
            description="Receive an email when a task is assigned to you"
            checked={prefs.email_on_assign}
            onChange={v => handleChange('email_on_assign', v)}
            disabled={saving}
          />
          <ToggleRow
            label="Mentioned"
            description="Receive an email when someone @mentions you in a comment"
            checked={prefs.email_on_mention}
            onChange={v => handleChange('email_on_mention', v)}
            disabled={saving}
          />
        </div>

        <p className="settings-hint pt-4">
          You will always receive important security emails regardless of these settings.
        </p>
      </section>
    </div>
  );
};
