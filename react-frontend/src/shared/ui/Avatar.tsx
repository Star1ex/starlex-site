// Avatar.tsx
import React from 'react';
import type { User } from '@/entities/types.js';

interface AvatarProps {
  user: User;
  size: 'xs' | 'sm' | 'md' | 'lg'; 
  className?: string;
}

const sizeClasses: Record<AvatarProps['size'], string> = {
  xs: 'w-4 h-4',
  sm: 'w-10 h-10',
  md: 'w-12 h-12', 
  lg: 'w-28 h-28 sm:w-36 sm:h-36',
};

const sizeTextClasses: Record<AvatarProps['size'], string> = {
  xs: 'text-[8px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg sm:text-xl',
};

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center`}>
        <span className={`font-semibold text-gray-600 dark:text-dark-text-muted ${sizeTextClasses[size]}`}>U</span>
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
        border 
        border-gray-200
        dark:border-dark-border
        bg-gradient-to-br 
        from-gray-200 
        to-gray-300
        dark:from-dark-border
        dark:to-dark-surface
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
          className="w-full h-full object-cover object-center rounded-full block"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span 
          className={`font-semibold leading-none tracking-tight text-gray-700 dark:text-dark-text select-none ${sizeTextClasses[size]}`}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
