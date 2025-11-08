import React from 'react';
import { COLORS } from '../../utils/constants';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = true, className = '' }) => {
  return (
    <div className={`logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Greek-inspired triskelion icon - representing Persis */}
        <circle cx="16" cy="16" r="14" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="16" r="4" fill="#D4AF37"/>
        {/* Three curved arms representing strength and movement */}
        <path d="M 16 2 Q 24 8 24 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        <path d="M 16 2 Q 8 8 8 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        <path d="M 16 30 Q 24 24 24 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        <path d="M 16 30 Q 8 24 8 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        <circle cx="24" cy="16" r="2" fill="#D4AF37"/>
        <circle cx="8" cy="16" r="2" fill="#D4AF37"/>
      </svg>
      {showText && (
        <span style={{ fontFamily: 'Georgia, serif', fontSize: `${size * 0.75}px`, letterSpacing: '2px', color: COLORS.text }}>
          Persis
        </span>
      )}
    </div>
  );
};

export default Logo;

