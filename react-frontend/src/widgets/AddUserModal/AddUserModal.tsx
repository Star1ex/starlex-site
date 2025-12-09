// AddUserModal.tsx - FULLY FIXED
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import { fetchWithAuth } from '@/app/api/api.js';
import type { SearchUserResult } from '@/entities/types.js';
import { getToken } from '@/entities/user.js';

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
  const [email, setEmail] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchUserResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchEmail: string) => {
    if (searchEmail.length < 3) {
      setSearchResult(null);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await fetchWithAuth(`/api/search/${encodeURIComponent(searchEmail)}`) as SearchUserResult;
      setSearchResult(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddUser = useCallback(async () => {
    if (!searchResult) return;
    
    setIsLoading(true);
    try {
      await fetchWithAuth(`/api/team/${teamId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchResult, email, teamId, onSuccess, onClose]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  }, [handleSearch]);

  const resetForm = useCallback(() => {
    setEmail('');
    setSearchResult(null);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="add-user-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale">
        <div className="p-8 border-b border-gray-200">
          <h2 id="add-user-title" className="text-2xl font-bold mb-2">Add Team Member</h2>
          <p className="text-gray-600">Search for a user by email to add them to your team.</p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="user-email">
              Enter email
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200"
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              Searching for {email}...
            </div>
          )}

          {searchResult && !isSearching && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
              <div className="flex items-center gap-4">
                <Avatar user={searchResult} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {`${searchResult.firstName} ${searchResult.lastName}`}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{searchResult.email}</p>
                </div>
              </div>
            </div>
          )}

          {!searchResult && !isSearching && email.length >= 3 && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
              No user found with email "{email}"
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={!searchResult || isLoading || isSearching}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
              aria-label={`Add ${searchResult?.firstName || ''} ${searchResult?.lastName || ''} to team`}
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
