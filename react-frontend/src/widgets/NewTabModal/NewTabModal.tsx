// src/widgets/NewTabModal/NewTabModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '@/shared/ui/Modal.js';
import { Input } from '@/shared/ui/Input.js';
import { Button } from '@/shared/ui/Button.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { getAuthHeaders } from '@/shared/lib/auth.js';

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
      const res = await fetch(
        `http://localhost:3000/api/search/${encodeURIComponent(q)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // здесь можешь вызвать logout() и перекинуть на /sign-in
          throw new Error('Unauthorized');
        }
        throw new Error('Search error');
      }

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

  return () => {
    cancelled = true;
  };
}, [debouncedEmail]);


  const normalizeEmail = (v: string) => v.trim().toLowerCase();

  const addEmail = (value: string) => {
    const normalized = normalizeEmail(value);
    if (!normalized) return;
    if (emails.includes(normalized)) {
      setError('Этот email уже добавлен');
      return;
    }
    setEmails(prev => [...prev, normalized]);
    setEmailInput('');
    setSearchResults([]);
    setError('');
    emailRef.current?.focus();
  };

  const handleSelectFromList = (user: User) => {
    addEmail(user.email);
  };

  const handleAddManually = () => {
    addEmail(emailInput);
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  // ===== СОЗДАНИЕ КОМАНДЫ /api/team =====
  const canSubmit =
    name.trim().length > 0 &&
    !submitting;

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

      const payload = {
        name: name.trim(),
        description: description.trim(),
        emails,
      };

      const res = await fetch('http://localhost:3000/api/team', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    },
    body: JSON.stringify({
    name: name.trim(),
    description: description.trim(),
    emails,
  }),
});

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to create team');
        setSubmitting(false);
        return;
      }

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

  // закрытие по крестику: чистим состояние
  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="text-3xl font-serif text-[#60392f] mb-6">New Tab</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs tracking-widest text-[#9b7a6f] uppercase mb-2">
            Name
          </label>
          <Input
            placeholder="Enter name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs tracking-widest text-[#9b7a6f] uppercase mb-2">
            Description
          </label>
          <Input
            placeholder="Optional description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Emails + поиск */}
        <div>
          <label className="block text-xs tracking-widest text-[#9b7a6f] uppercase mb-2">
            Emails
          </label>
          <div className="flex items-center gap-3">
            <Input
              ref={emailRef}
              placeholder="your@email.com"
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value);
                setError('');
              }}
            />
            <button
              type="button"
              onClick={handleAddManually}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#d4a89a] text-[#7b5a4f]"
              title="Add email"
            >
              +
            </button>
          </div>

          {/* список найденных пользователей */}
          {debouncedEmail && (
            <div className="mt-2 bg-[#f8ece5] rounded border border-[#e0c6b7] max-h-40 overflow-y-auto">
              {loadingSearch && (
                <div className="px-3 py-2 text-sm text-[#9b7a6f]">
                  Searching…
                </div>
              )}

              {!loadingSearch && searchResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-[#9b7a6f]">
                  No users found, press “+” to add manually
                </div>
              )}

              {!loadingSearch &&
                searchResults.map(user => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleSelectFromList(user)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#ead4ca] text-[#60392f]"
                  >
                    <span className="font-medium">{user.email}</span>
                    {user.name && (
                      <span className="ml-2 text-xs text-[#9b7a6f]">
                        {user.name}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}

          {/* уже добавленные email‑ы */}
          {emails.length > 0 && (
            <ul className="mt-3 space-y-1">
              {emails.map(email => (
                <li
                  key={email}
                  className="flex items-center justify-between text-sm text-[#60392f]"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-[#7b5a4f] hover:text-[#a06e5f]"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 bg-[#d4a89a] hover:bg-[#c69a8c] disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Add Tab'}
        </Button>
      </form>
    </Modal>
  );
};
