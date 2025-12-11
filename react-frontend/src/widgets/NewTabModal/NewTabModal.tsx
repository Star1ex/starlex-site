import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '@/shared/ui/Modal.js';
import { Input } from '@/shared/ui/Input.js';
import { Button } from '@/shared/ui/Button.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { getAuthHeaders } from '@/shared/lib/auth.js';

export const API_URL = import.meta.env.VITE_API_URL ?? '';

type User = {
  email: string;
  name?: string;
};

type Team = {
  id: string;
  name: string;
  description: string;
  emails: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
};

export const NewTabModal: React.FC<Props> = ({ open, onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const debouncedEmail = useDebounce(emailInput, 400);

  useEffect(() => {
    const q = debouncedEmail.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const fetchUsers = async () => {
      try {
        setLoadingSearch(true);

        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...getAuthHeaders(),
        };

        const res = await fetch(`/api/search/${encodeURIComponent(q)}`, { headers });
        if (!res.ok) throw new Error(`Search error: ${res.status}`);

        const data: User[] = await res.json();
        if (!cancelled) setSearchResults(data);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, [debouncedEmail]);

  const normalizeEmail = (v: string) => v.trim().toLowerCase();
  const addEmail = (value: string) => {
    const normalized = normalizeEmail(value);
    if (!normalized) return;
    if (emails.includes(normalized)) {
      setError('This email already used');
      return;
    }
    setEmails(prev => [...prev, normalized]);
    setEmailInput('');
    setSearchResults([]);
    setError('');
    emailRef.current?.focus();
  };
  const handleSelectFromList = (user: User) => addEmail(user.email);
  const handleAddManually = () => addEmail(emailInput);
  const handleRemoveEmail = (email: string) => setEmails(prev => prev.filter(e => e !== email));

  const canSubmit = name.trim().length > 0 && !submitting;

  const resetState = () => {
    setName('');
    setDescription('');
    setEmails([]);
    setEmailInput('');
    setSearchResults([]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSubmitting(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      };

      const res = await fetch(`/api/team`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: name.trim(), description: description.trim(), emails }),
      });

      if (!res.ok) return;

      const created: Team = await res.json();
      onTeamCreated(created);
      resetState();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Network error while creating team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { resetState(); onClose(); };

  return (
  <Modal open={open} onClose={handleClose}>
    <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-serif text-black mb-4 sm:mb-6">New Tab</h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs sm:text-sm tracking-widest text-black uppercase mb-1 sm:mb-2">Name</label>
          <Input
            placeholder="Enter name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm tracking-widest text-black uppercase mb-1 sm:mb-2">Description</label>
          <Input
            placeholder="Optional description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Emails */}
        <div>
          <label className="block text-xs sm:text-sm tracking-widest text-black uppercase mb-1 sm:mb-2">Emails</label>
          <div className="flex gap-2 sm:gap-3 items-center">
            <Input
              ref={emailRef}
              placeholder="your@email.com"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setError(''); }}
            />
            <button
              type="button"
              onClick={handleAddManually}
              className="w-8 h-8 flex items-center justify-center rounded border border-black text-black hover:bg-gray-200 transition-colors duration-200"
              title="Add email"
            >
              +
            </button>
          </div>

          {/* Search results dropdown */}
          {debouncedEmail && (
            <div className="mt-2 bg-white rounded border border-black max-h-40 overflow-y-auto transition-colors duration-200 text-sm sm:text-base">
              {loadingSearch && <div className="px-3 py-2 text-black">Searching…</div>}
              {!loadingSearch && searchResults.length === 0 && (
                <div className="px-3 py-2 text-black">No users found, press “+” to add manually</div>
              )}
              {!loadingSearch && searchResults.map(user => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleSelectFromList(user)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className="font-medium">{user.email}</span>
                  {user.name && <span className="ml-2 text-xs">{user.name}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Added emails */}
          {emails.length > 0 && (
            <ul className="mt-2 max-h-36 overflow-y-auto space-y-1 text-sm sm:text-base">
              {emails.map(email => (
                <li key={email} className="flex items-center justify-between">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-black hover:text-gray-700 transition-colors duration-200"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 bg-black text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Add Tab'}
        </Button>
      </form>
    </div>
  </Modal>
);
};
