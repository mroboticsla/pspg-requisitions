'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  initials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
};

export default function UserAvatar({ avatarUrl, initials, size = 'md', className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const baseClasses = sizeClasses[size];
  
  // Si hay URL y no ha fallado la carga
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className={`${baseClasses} rounded-full object-cover shadow-md ${className}`}
        onError={() => {
          console.error('Error al cargar avatar:', avatarUrl);
          setImageError(true);
        }}
      />
    );
  }

  // Mostrar iniciales si no hay imagen o falló la carga
  return (
    <div
      className={`${baseClasses} rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md overflow-hidden ${className}`}
    >
      {/* Avatar genérico SVG */}
      <svg 
        className="w-full h-full text-indigo-300" 
        viewBox="0 0 100 100" 
        fill="currentColor"
      >
        {/* Cabeza */}
        <circle cx="50" cy="35" r="18" />
        {/* Cuerpo/Hombros */}
        <path d="M 20 85 Q 20 60 50 60 Q 80 60 80 85 L 80 100 L 20 100 Z" />
      </svg>
    </div>
  );
}
