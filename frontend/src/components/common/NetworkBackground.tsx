'use client';

import React from 'react';

/**
 * Clean, airy light atmospheric backdrop for GovSchemeAI.
 * Inspired by official public portals: warm crisp off-white with
 * very soft mint and warm-cream ambient light. Zero battery drain.
 */
export const NetworkBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Warm Crisp Off-White Base */}
      <div className="absolute inset-0 bg-[#F7F8F5]" />

      {/* Atmospheric Soft Mint - Top Left */}
      <div 
        className="absolute -top-[25%] -left-[10%] w-[65vw] h-[65vw] max-w-[850px] max-h-[850px] rounded-full opacity-[0.45] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #E7F3EC 0%, rgba(231, 243, 236, 0) 70%)' }}
      />

      {/* Atmospheric Warm Cream - Top Right */}
      <div 
        className="absolute -top-[20%] -right-[15%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full opacity-[0.55] blur-[150px]"
        style={{ background: 'radial-gradient(circle, #FAF5E9 0%, rgba(250, 245, 233, 0) 70%)' }}
      />

      {/* Subtle Micro Dot Texture */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#202820 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

export default NetworkBackground;
