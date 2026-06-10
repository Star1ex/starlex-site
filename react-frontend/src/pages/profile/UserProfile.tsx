import React, { useEffect, useState } from 'react';
import { Check, Pencil, Upload, X } from 'lucide-react';
import { userService } from '@/services/api/index.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';
import { showToast } from '@/shared/lib/toast.js';

type UserProfile = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
  auth_providers?: string[];
};

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editable, setEditable] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        if (cancelled) return;
        setUser(data);
        setForm(data);
      } catch {
        if (!cancelled) showToast('Failed to load profile', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUser();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    try {
      setUploading(true);
      const data = await userService.uploadPhoto(file);
      setUser(prev => (prev ? { ...prev, photo_url: data.url } : prev));
      setForm(prev => (prev ? { ...prev, photo_url: data.url } : prev));
      showToast('Profile photo updated', 'success');
    } catch {
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      await userService.updateProfile({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        photo_url: form.photo_url ?? null,
      });

      setUser(form);
      setEditable(false);
      showToast('Profile saved', 'success');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(user);
    setEditable(false);
  };

  if (loading) {
    return (
      <div className="profile-page animate-pulse">
        <div className="mb-4 h-5 w-28 rounded-full bg-[color:var(--sx-control)]" />
        <section className="profile-shell">
          <div className="profile-header">
            <div>
              <div className="h-7 w-28 rounded-full bg-[color:var(--sx-control)]" />
              <div className="mt-3 h-4 w-52 rounded-full bg-[color:var(--sx-control)]" />
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="h-10 w-36 rounded-full bg-[color:var(--sx-control)]" />
              <div className="h-10 w-28 rounded-full bg-[color:var(--sx-control)]" />
            </div>
          </div>
          <div className="profile-content">
            <div className="profile-identity-card">
              <div className="profile-avatar-skeleton" />
              <div className="h-4 w-36 rounded-full bg-[color:var(--sx-control)]" />
              <div className="h-3 w-44 rounded-full bg-[color:var(--sx-control)]" />
            </div>
            <div className="profile-details-card">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="profile-field-skeleton">
                  <div className="h-3 w-20 rounded-full bg-[color:var(--sx-control)]" />
                  <div className="h-10 rounded-full bg-[color:var(--sx-control)]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!user || !form) {
    return (
      <div className="profile-page">
        <section className="settings-section text-center">
          <h1 className="settings-section-title">Profile unavailable</h1>
          <p className="settings-section-description">We could not load your profile right now.</p>
        </section>
      </div>
    );
  }

  const displayName = `${form.firstName || ''}${form.lastName ? ` ${form.lastName}` : ''}`.trim() || 'User';
  const avatarSrc = user.photo_url || user.avatar_url || '';

  return (
    <div className="profile-page">
      <div className="mb-4">
        <BreadcrumbBack
          label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
          to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
        />
      </div>

      <section className="profile-shell">
        <header className="profile-header">
          <div>
            <p className="settings-label">Account</p>
            <h1 className="profile-title">Profile</h1>
            <p className="profile-subtitle">Manage your account details.</p>
          </div>

          {!editable && (
            <div className="profile-actions">
              <button
                onClick={() => setEditable(true)}
                className="settings-button settings-button--primary"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
            </div>
          )}
        </header>

        <div className="profile-content">
          <aside className="profile-identity-card">
            <div className="profile-avatar">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0 text-center">
              <div className="profile-name">{displayName}</div>
              <div className="profile-email">{form.email}</div>
            </div>

            {user.auth_providers && user.auth_providers.length > 0 && (
              <div className="settings-status-pill">
                Signed in with {user.auth_providers.join(', ')}
              </div>
            )}

            {editable && (
              <label className="settings-button mt-2 cursor-pointer">
                <Upload size={14} />
                {uploading ? 'Uploading...' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                />
              </label>
            )}
          </aside>

          <div className="profile-details-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField
                label="First name"
                value={form.firstName}
                editable={editable}
                onChange={v => handleChange('firstName', v)}
              />
              <ProfileField
                label="Last name"
                value={form.lastName}
                editable={editable}
                onChange={v => handleChange('lastName', v)}
              />
              <ProfileField
                label="Email"
                value={form.email}
                editable={editable}
                onChange={v => handleChange('email', v)}
                wide
              />
            </div>
          </div>
        </div>

        {editable && (
          <div className="profile-edit-actions">
            <button
              onClick={handleCancel}
              className="settings-button"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="settings-button settings-button--primary"
            >
              <Check size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

type ProfileFieldProps = {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
  wide?: boolean;
};

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  editable,
  onChange,
  wide = false,
}) => {
  return (
    <div className={wide ? 'profile-field sm:col-span-2' : 'profile-field'}>
      <span className="settings-label">
        {label}
      </span>
      {editable ? (
        <input
          className="settings-input"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div className="profile-readonly-value">
          {value}
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
