import React from 'react';
import guildLogoPath from '@assets/GuttaKrut_transparent_background.png';

interface GuildLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function GuildLogo({ className = '', size = 'md' }: GuildLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto'
  };

  return (
    <img 
      src={guildLogoPath} 
      alt="Guttakrutt" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}