// Avatar.tsx
import React from 'react';
import type { User } from '@/entities/types.js';

interface AvatarProps {
  user: User;
  size: 'sm' | 'md' | 'lg'; 
  className?: string;
}

const sizeClasses: Record<AvatarProps['size'], string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
};

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}>
        <span className="font-semibold text-xs text-gray-600">U</span>
      </div>
    );
  }

  const avatarSize = sizeClasses[size];
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const initials = (firstName && firstName.length > 0 && lastName && lastName.length > 0)
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : (firstName && firstName.length > 0)
      ? firstName.charAt(0).toUpperCase()
      : (lastName && lastName.length > 0)
        ? lastName.charAt(0).toUpperCase()
        : 'U';
  
  // Fallback image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).style.display = 'none';
  };

  return (
    <div 
      className={`
        ${avatarSize} 
        rounded-full 
        overflow-hidden 
        flex 
        items-center 
        justify-center 
        flex-shrink-0 
        shadow-sm 
        border 
        border-gray-200
        bg-gradient-to-br 
        from-gray-200 
        to-gray-300
        ${className}
      `}
      role="img"
      aria-label={`${firstName} ${lastName} avatar`}
      title={`${firstName} ${lastName}`}
    >
      {user?.photo_url ? (
        <img
          src={user.photo_url}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span 
          className="font-semibold text-xs sm:text-sm leading-none tracking-tight text-gray-700 select-none"
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
