import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sprintService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';

interface CreateSprintModalProps {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({ isOpen, teamId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setGoal('');
      setStartDate('');
      setEndDate('');
      const timer = setTimeout(() => nameRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await sprintService.createSprint(teamId, {
        name: name.trim(),
        goal: goal.trim() || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      });
      onSuccess();
      onClose();
    } catch {
      showToast('Failed to create sprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
              style={{ background: 'var(--bg-primary)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                New Sprint
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="Sprint name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Goal (optional)"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Start date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      End date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-70"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-40"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  >
                    {loading ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateSprintModal;
