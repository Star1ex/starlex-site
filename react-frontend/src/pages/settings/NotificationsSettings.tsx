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
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-body-md text-white/80 font-medium">{label}</p>
        <p className="text-label-sm text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`flex-shrink-0 relative w-10 h-5.5 rounded-full transition-all duration-200 ${
          checked ? 'bg-[--accent]' : 'bg-white/10'
        } disabled:opacity-40`}
        style={{ width: 40, height: 22 }}
      >
        <span
          className="absolute top-0.5 transition-all duration-200 w-[18px] h-[18px] rounded-full bg-white shadow-sm"
          style={{ left: checked ? 20 : 2 }}
        />
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
      <div className="space-y-3 animate-pulse">
        {[0, 1].map(i => <div key={i} className="h-14 rounded-xl bg-white/4" />)}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={14} className="text-white/40" />
        <h3 className="label-caps text-white/40">Email notifications</h3>
      </div>

      {error && <p className="text-label-sm text-[#fca5a5] mb-3">{error}</p>}

      <div className="divide-y divide-white/5">
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

      <p className="text-label-sm text-white/25 pt-4">
        You will always receive important security emails regardless of these settings.
      </p>
    </div>
  );
};
