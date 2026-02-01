import React, { useEffect, useState } from 'react';
import { userService } from '@/services/api/index.js';

type UserProfile = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  photo_url?: string | null;
};

const ProfilePage: React.FC = () => {
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
      <div className="flex items-center justify-center h-full bg-white dark:bg-dark-bg transition-colors duration-300">
        <div className="text-gray-700 dark:text-dark-text-muted">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-white dark:bg-dark-bg transition-colors duration-300 px-4 sm:px-6 py-12">
      <div className="bg-white dark:bg-dark-surface rounded-3xl px-6 sm:px-10 py-6 sm:py-8 shadow-md w-full max-w-md sm:max-w-xl transition-all duration-300">
        <h1 className="text-2xl sm:text-3xl font-serif text-black dark:text-dark-text mb-4 sm:mb-6 text-center sm:text-left transition-colors duration-300">
          Profile
        </h1>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-400 dark:border-dark-border bg-gray-100 dark:bg-dark-border flex items-center justify-center flex-shrink-0 transition-all duration-300">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt="Avatar"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 dark:bg-dark-surface rounded-full transition-colors duration-300" />
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-dark-text-muted w-full sm:w-auto">
            <span className="font-medium text-center sm:text-left">Profile photo</span>
            {editable && (
              <>
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
                <span className="text-[11px] text-gray-500 dark:text-dark-text-muted text-center sm:text-left">
                  JPG/PNG, max 5MB
                </span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
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

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3">
          {!editable ? (
            <button
              onClick={() => setEditable(true)}
              className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs tracking-wide hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
            >
              Edit
            </button>
          ) : (
            <>
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
            </>
          )}
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
