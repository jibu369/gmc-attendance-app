import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-light-surface dark:bg-dark-surface rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-700/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;