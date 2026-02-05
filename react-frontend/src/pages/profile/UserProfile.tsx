import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/api/index.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

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
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editable, setEditable] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data);
        setForm(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploading(true);
      const data = await userService.uploadPhoto(file);
      setUser(prev => (prev ? { ...prev, photo_url: data.url } : prev));
      setForm(prev => (prev ? { ...prev, photo_url: data.url } : prev));
    } catch (err) {
      console.error('Failed to upload photo:', err);
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
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(user);
    setEditable(false);
  };

  if (!user || !form) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300 px-4 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="rounded-2xl overflow-hidden border border-gray-200/40 dark:border-dark-border/40 bg-white dark:bg-dark-surface shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100/50 dark:border-dark-border/40 bg-gray-50 dark:bg-dark-bg/40">
              <div className="h-6 w-32 bg-gray-200 dark:bg-dark-border rounded-full" />
              <div className="mt-2 h-3 w-48 bg-gray-200 dark:bg-dark-border rounded-full" />
            </div>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-dark-border" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-dark-border rounded-full" />
                      <div className="h-3 w-40 bg-gray-200 dark:bg-dark-border rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200/40 dark:border-dark-border/40">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-dark-border rounded-full" />
                      <div className="mt-3 h-4 w-48 bg-gray-200 dark:bg-dark-border rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300 px-4 sm:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <BreadcrumbBack
            label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
            to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
          />
        </div>
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-dark-text">Profile</h1>
                <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">Manage your account details</p>
              </div>
              {!editable && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/settings?tab=password')}
                    className="px-5 py-2 rounded-full border border-black dark:border-white text-black dark:text-white text-xs tracking-wide bg-transparent hover:bg-gray-100 dark:hover:bg-dark-border transition-colors duration-200 w-full sm:w-auto"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => setEditable(true)}
                    className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs tracking-wide hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-border flex items-center justify-center flex-shrink-0 transition-all duration-300">
                    {(user.photo_url || user.avatar_url) ? (
                      <img
                        src={user.photo_url || user.avatar_url || ''}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 dark:bg-dark-surface rounded-full transition-colors duration-300" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-dark-text">{form.firstName} {form.lastName}</div>
                    <div className="text-xs text-gray-500 dark:text-dark-text-muted">{form.email}</div>
                    {user.auth_providers && user.auth_providers.length > 0 && (
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mt-1">
                        Signed in with {user.auth_providers.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {editable && (
                  <div className="mt-6 space-y-2 text-sm text-gray-700 dark:text-dark-text-muted">
                    <span className="font-medium">Profile photo</span>
                    <label className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 text-xs tracking-wide transition-colors duration-200 whitespace-nowrap">
                      {uploading ? 'Uploading...' : 'Upload new'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadPhoto}
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-[11px] text-gray-500 dark:text-dark-text-muted">
                      JPG/PNG, max 5MB
                    </span>
                  </div>
                )}
              </div>

              <div className="lg:flex-1">
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
                  />
                </div>
              </div>
            </div>

            {editable && (
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 rounded-full border border-black dark:border-white text-black dark:text-white text-xs tracking-wide bg-transparent hover:bg-gray-100 dark:hover:bg-dark-border transition-colors duration-200 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs tracking-wide hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60 transition-colors duration-200 w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type ProfileFieldProps = {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
};

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  editable,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted transition-colors duration-300">
        {label}
      </span>
      {editable ? (
        <input
          className="w-full px-4 py-2 rounded-full bg-gray-100 dark:bg-dark-border border border-gray-300 dark:border-dark-border text-sm text-black dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-200"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div className="w-full px-4 py-2 rounded-full bg-gray-50 dark:bg-dark-border/30 border border-transparent text-sm text-black dark:text-dark-text transition-colors duration-300">
          {value}
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
