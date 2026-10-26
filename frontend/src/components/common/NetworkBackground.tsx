'use client';

import React from 'react';

/**
 * Modern, calm atmospheric backdrop for GovSchemeAI.
 * Uses high-performance CSS radial gradients and subtle civic geometry,
 * avoiding distracting neon particle lines or high-GPU battery drain.
 */
export const NetworkBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep Dark Base Fill */}
      <div className="absolute inset-0 bg-[#080C15]" />

      {/* Atmospheric Civic Lighting - Soft Trust Blue Top-Left */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-[0.07] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
      />

      {/* Atmospheric Saffron Ambient Warmth - Top-Right */}
      <div 
        className="absolute -top-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full opacity-[0.05] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
      />

      {/* Subtle Verified Emerald Glow - Bottom Center */}
      <div 
        className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[40vw] max-w-[900px] max-h-[600px] rounded-full opacity-[0.04] blur-[160px]"
        style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
      />

      {/* Subtle Civic Grid / Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};

export default NetworkBackground;
