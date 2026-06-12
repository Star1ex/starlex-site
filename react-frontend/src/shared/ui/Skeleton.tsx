import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`skeleton-shimmer ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={14}
        width={i === lines - 1 ? '60%' : '100%'}
        rounded="sm"
      />
    ))}
  </div>
);
