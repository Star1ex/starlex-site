import React, { useEffect, useRef, useState } from 'react';

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

// Mock components for demo
const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input
    ref={ref}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
    {...props}
  />
));

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
);

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const getAuthHeaders = () => ({ Authorization: 'Bearer mock-token' });

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
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(normalized)) {
      setError('This email is already added');
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

      if (!res.ok) {
        throw new Error('Failed to create team');
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

  const handleClose = () => { 
    resetState(); 
    onClose(); 
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto p-5 sm:p-8 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">New Tab</h2>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter tab name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Input
              placeholder="Optional description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Emails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members
            </label>
            <div className="flex gap-2 items-center">
              <Input
                ref={emailRef}
                placeholder="email@example.com"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManually();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddManually}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border-2 border-black text-black text-xl font-bold hover:bg-black hover:text-white transition-all duration-200 active:scale-95"
                title="Add email"
              >
                +
              </button>
            </div>

            {/* Search results dropdown */}
            {debouncedEmail && (
              <div className="mt-2 bg-white rounded-lg border border-gray-300 shadow-lg max-h-48 overflow-y-auto">
                {loadingSearch && (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    Searching…
                  </div>
                )}
                {!loadingSearch && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No users found. Press "+" to add manually
                  </div>
                )}
                {!loadingSearch && searchResults.map(user => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleSelectFromList(user)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-black">{user.email}</div>
                    {user.name && (
                      <div className="text-xs text-gray-500 mt-0.5">{user.name}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Added emails */}
            {emails.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {emails.map(email => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm text-gray-800 truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-150"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-1/2 py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-98"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-1/2 py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-98 disabled:active:scale-100"
            >
              {submitting ? 'Creating…' : 'Create Tab'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewTabModal;