import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { useModal } from '@/shared/hooks/useModal.js';
import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService } from '@/services/api/index.js';
import { pageVariants } from '@/shared/lib/animations.js';
import { getAllRecent, type RecentItem } from '@/shared/lib/recentItems.js';
import { Clock, Users, Layers, FileText, Plus, Search } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { SearchModal } from '@/widgets/SearchModal/SearchModal.js';

type Team = { id: string; name: string; description: string; emails: string[] };

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.getFullYear() !== now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_ICON: Record<RecentItem['type'], React.ReactNode> = {
  team:   <Users size={20} />,
  sprint: <Layers size={20} />,
  task:   <FileText size={20} />,
};

const TYPE_LABEL: Record<RecentItem['type'], string> = {
  team:   'Team',
  sprint: 'Sprint',
  task:   'Task',
};

const RecentCard: React.FC<{ item: RecentItem; index: number }> = ({ item, index }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + index * 0.04, duration: 0.22, ease: 'easeOut' } }}
      onClick={() => navigate(item.url)}
      className="flex-shrink-0 w-40 rounded-xl p-4 text-left flex flex-col justify-between transition-all duration-150 group"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid transparent',
        height: '128px',
      }}
      whileHover={{
        scale: 1.02,
        borderColor: 'var(--border-color)',
        transition: { duration: 0.12 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 flex items-center justify-center rounded-lg"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
      >
        {TYPE_ICON[item.type]}
      </div>

      {/* Name + meta */}
      <div>
        <p
          className="text-sm font-medium leading-snug line-clamp-2 mb-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {fmtDate(item.openedAt)}
        </p>
      </div>
    </motion.button>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { open, onOpen, onClose } = useModal(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [recent, setRecent] = useState(getAllRecent());
  const [searchOpen, setSearchOpen] = useState(false);

  const refreshRecent = useCallback(() => setRecent(getAllRecent()), []);

  useEffect(() => {
    const storedUser = getAuthUser();
    if (storedUser?.firstName || storedUser?.first_name) {
      setUserName((storedUser.firstName || storedUser.first_name || '').split(' ')[0]);
    }

    userService.getProfile()
      .then((data: any) => {
        setUserName((data.firstName || '').split(' ')[0] || '');
      })
      .catch((err: any) => {
        if (err?.response?.status === 401) navigate('/sign-in');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('focus', refreshRecent);
    return () => window.removeEventListener('focus', refreshRecent);
  }, [refreshRecent]);

  const handleTeamCreated = useCallback((team: Team) => {
    window.dispatchEvent(new CustomEvent('teamCreated'));
    onClose();
    refreshRecent();
  }, [onClose, refreshRecent]);

  useDocumentTitle('Home');

  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [hour]);

  // All recent items sorted by time, max 8
  const allRecent = useMemo(() => {
    const { teams, sprints, tasks } = recent;
    return [...teams, ...sprints, ...tasks]
      .sort((a, b) => b.openedAt - a.openedAt)
      .slice(0, 8);
  }, [recent]);

  return (
    <motion.div
      className="min-h-full transition-colors duration-300"
      style={{ background: 'var(--bg-primary)' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-4xl mx-auto px-8 pt-16 pb-16">

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
          className="text-center text-4xl font-bold tracking-tight mb-12"
          style={{ color: 'var(--text-primary)' }}
        >
          {loading && !userName
            ? greeting
            : `${greeting}${userName ? `, ${userName}` : ''}`}
        </motion.h1>

        {/* Search bar */}
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.08, duration: 0.22, ease: 'easeOut' } }}
          onClick={() => setSearchOpen(true)}
          className="w-full max-w-md mx-auto flex items-center gap-3 px-4 py-2.5 rounded-xl mb-10 transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          whileHover={{ borderColor: 'var(--text-secondary)', transition: { duration: 0.12 } }}
        >
          <Search size={15} />
          <span className="flex-1 text-left text-sm">Search teams, sprints, tasks…</span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>⌘K</span>
        </motion.button>

        {/* Recently visited */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.06, duration: 0.2 } }}
            className="flex items-center gap-2 mb-4"
          >
            <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Recently visited
            </span>
          </motion.div>

          {allRecent.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              className="flex gap-3"
            >
              {/* Placeholder cards */}
              {[
                { label: 'Open a team', icon: <Users size={20} />, action: onOpen },
                { label: 'New task', icon: <FileText size={20} />, action: () => navigate('/task/new') },
              ].map((p, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05, duration: 0.2 } }}
                  onClick={p.action}
                  className="flex-shrink-0 w-40 rounded-xl p-4 text-left flex flex-col justify-between transition-all duration-150"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid transparent', height: '128px' }}
                  whileHover={{ scale: 1.02, borderColor: 'var(--border-color)', transition: { duration: 0.12 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.label}</p>
                    <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <Plus size={11} /> Get started
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              <AnimatePresence initial={false}>
                {allRecent.map((item, i) => (
                  <RecentCard key={`${item.type}-${item.id}`} item={item} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Quick actions row */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.24, ease: 'easeOut' } }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Quick actions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'New team', icon: <Users size={14} />, action: onOpen },
              { label: 'New task', icon: <FileText size={14} />, action: () => navigate('/task/new') },
            ].map((a, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={a.action}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>

      {open && (
        <NewTabModal
          open={open}
          onClose={onClose}
          onTeamCreated={handleTeamCreated}
        />
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.div>
  );
};
