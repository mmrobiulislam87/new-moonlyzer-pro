import React, { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface TabProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

export const Tab: React.FC<TabProps> = ({ title, isActive, onClick, icon, disabled, tooltip }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip || title}
      className={cn(
        "flex items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 transition-colors duration-150 ease-in-out group whitespace-nowrap px-3 py-1.5 text-xs font-medium",
        isActive 
          ? 'bg-primary text-white shadow-md ring-2 ring-primary-dark/75' 
          : 'bg-neutral-lightest text-textSecondary border border-neutral-light hover:bg-primary-lighter hover:text-primary-dark hover:border-primary-light shadow-sm',
        disabled && "opacity-60 cursor-not-allowed bg-neutral-light hover:bg-neutral-light text-neutral-DEFAULT border-neutral-light"
      )} 
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && <span className={cn(
        `mr-1.5 h-4 w-4`, 
        isActive ? 'text-white' : 'text-textSecondary group-hover:text-primary-dark',
        disabled && 'text-neutral-DEFAULT group-hover:text-neutral-DEFAULT'
      )}>{icon}</span>}
      {title}
    </button>
  );
};

interface TabsProps {
  children: ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  return (
    <div className=""> 
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Tabs">
        {children}
      </nav>
    </div>
  );
};