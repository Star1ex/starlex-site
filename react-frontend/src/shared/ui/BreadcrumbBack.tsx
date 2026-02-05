import React from 'react';
import { useNavigate } from 'react-router-dom';

type BreadcrumbBackProps = {
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
};

export const BreadcrumbBack: React.FC<BreadcrumbBackProps> = ({ label, to, onClick, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
      return;
    }
    navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm text-gray-500 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors ${className}`}
      aria-label={`Back to ${label}`}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
};

export default BreadcrumbBack;
