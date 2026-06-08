import React from 'react';
import { usePresence, type PresenceUser } from '@/shared/hooks/usePresence.js';

interface AvatarBubbleProps { user: PresenceUser; size?: number }

function AvatarBubble({ user, size = 28 }: AvatarBubbleProps) {
  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const src = user.photo_url ?? undefined;
  return (
    <div
      className="rounded-full border-2 border-black overflow-hidden bg-white/10 flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Member'}
    >
      {src ? (
        <img src={src} alt={initials} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface PresenceAvatarsProps {
  maxVisible?: number;
  size?: number;
  className?: string;
}

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({
  maxVisible = 5,
  size = 28,
  className = '',
}) => {
  const users = usePresence();
  if (users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className={`flex items-center ${className}`} style={{ gap: -(size * 0.25) }}>
      {visible.map((u, i) => (
        <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -(size * 0.25), zIndex: visible.length - i }}>
          <AvatarBubble user={u} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full border-2 border-black bg-white/15 flex items-center justify-center text-white/70 font-semibold flex-shrink-0"
          style={{ width: size, height: size, fontSize: size * 0.34, marginLeft: -(size * 0.25) }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
