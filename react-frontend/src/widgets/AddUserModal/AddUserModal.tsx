// AddUserModal.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { SearchUserResult } from '@/entities/types.js';
import { searchService, teamService } from '@/services/api/index.js';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  teamId 
}) => {
  const [email, setEmail] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchEmail: string) => {
    if (searchEmail.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchService.searchUsers(searchEmail);
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddUser = useCallback(async (userEmail: string) => {
    setIsLoading(true);
    try {
      await teamService.addUserToTeam(teamId, userEmail);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, onSuccess, onClose]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  }, [handleSearch]);

  const resetForm = useCallback(() => {
    setEmail('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

 if (!isOpen) return null;

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-900 dark:text-dark-text">Add Team Member</h2>
        <p className="text-gray-600 dark:text-dark-text-muted text-sm sm:text-base">
          Search for a user by email to add them to your team.
        </p>
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
        {/* Input */}
        <div>
          <label
            className="block text-sm sm:text-base font-medium text-gray-700 dark:text-dark-text mb-1 sm:mb-2"
            htmlFor="user-email"
          >
            Enter email
          </label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={handleInputChange}
            placeholder="user@example.com"
            disabled={isLoading}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text transition-all duration-200"
          />
        </div>

        {/* Searching */}
        {isSearching && (
          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-500 dark:text-dark-text-muted px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-border/30 rounded-xl">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 dark:border-gray-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
            Searching for {email}...
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && !isSearching && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map(user => (
              <div
                key={user.id}
                className="p-3 sm:p-4 bg-gray-50 dark:bg-dark-border/30 rounded-xl flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                onClick={() => handleAddUser(user.email)}
              >
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-dark-text truncate text-sm sm:text-base">
                    {`${user.firstName} ${user.lastName}`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-muted truncate">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isSearching && searchResults.length === 0 && email.length >= 3 && (
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-dark-border/30 rounded-xl text-center text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted">
            No user found with email "{email}"
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border font-medium text-sm sm:text-base transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

};

export default AddUserModal;
