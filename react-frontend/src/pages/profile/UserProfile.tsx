import React, { useEffect, useState } from 'react';
import { API_URL, getToken, UserProfile } from '@/entities/user.js';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editable, setEditable] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data: UserProfile = await res.json();
        setUser(data);
        setForm(data);
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

    const token = getToken();
    if (!token) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploading(true);
      const res = await fetch(`/api/users/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
         throw new Error(`Error: ${res.status}`);
      }

      const data: { url: string } = await res.json();
      setUser(prev => (prev ? { ...prev, photo_url: data.url } : prev));
      setForm(prev => (prev ? { ...prev, photo_url: data.url } : prev));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    const token = getToken();
    if (!token) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/users/update`, {
        method: 'PUT', 
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          photo_url: form.photo_url ?? null,
        }),
      });

      if (!res.ok) {
         return;
        }

      setUser(form);
      setEditable(false);
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
      <div className="flex items-center justify-center h-full bg-[#f3e6de]">
        <div className="text-[#7b5a4f]">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3e6de]">
      <div className="bg-[#f9efe8] border border-[#e2c9bd] rounded-3xl px-10 py-8 shadow-sm max-w-xl w-full">
        <h1 className="text-3xl font-serif text-[#5c3a32] mb-6">
          Profile
        </h1>

        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-[#d4a89a] bg-[#ead4ca] flex items-center justify-center">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#d4a89a] to-[#c69a8c] rounded-full" />
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm text-[#7b5a4f]">
            <span className="font-medium">Profile photo</span>
            {editable && (
              <>
                <label className="inline-flex items-center px-4 py-2 rounded-full bg-[#d4a89a] text-white cursor-pointer hover:bg-[#c18c7c] text-xs tracking-wide">
                  {uploading ? 'Uploading...' : 'Upload new'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPhoto}
                    disabled={uploading}
                  />
                </label>
                <span className="text-[11px] text-[#9a7667]">
                  JPG/PNG, max 5MB
                </span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <ProfileField
            label="First name"
            value={form.first_name}
            editable={editable}
            onChange={v => handleChange('first_name', v)}
          />
          <ProfileField
            label="Last name"
            value={form.last_name}
            editable={editable}
            onChange={v => handleChange('last_name', v)}
          />
          <ProfileField
            label="Email"
            value={form.email}
            editable={editable}
            onChange={v => handleChange('email', v)}
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          {!editable ? (
            <button
              onClick={() => setEditable(true)}
              className="px-5 py-2 rounded-full bg-[#d4a89a] text-white text-xs tracking-wide hover:bg-[#c18c7c]"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-full border border-[#d4a89a] text-[#7b5a4f] text-xs tracking-wide bg-transparent hover:bg-[#edd9cf]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-[#d4a89a] text-white text-xs tracking-wide hover:bg-[#c18c7c] disabled:opacity-60"
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
      <span className="text-xs uppercase tracking-[0.2em] text-[#b08b7c]">
        {label}
      </span>
      {editable ? (
        <input
          className="w-full px-4 py-2 rounded-full bg-[#f3e1d7] border border-[#e2c9bd] text-sm text-[#5c3a32] focus:outline-none focus:ring-2 focus:ring-[#d4a89a]"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div className="w-full px-4 py-2 rounded-full bg-[#f5e6dd] border border-transparent text-sm text-[#5c3a32]">
          {value}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
