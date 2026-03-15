"use client";
import { useEffect, useState } from 'react';

export default function StatsHoverBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Smoothly fade in the container spacing after the component mounts
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    /* We keep the container and card classes to preserve your vertical spacing, 
       but we have removed all internal text and icons to clear the clutter above 
       the Summit Velocity badge. 
    */
    <div className={`stats-hover-container ${visible ? 'visible' : ''}`}>
      <div className="stats-hover-card" style={{ padding: '0', border: 'none', background: 'transparent', boxShadow: 'none' }}>
        <div className="stats-glow"></div>
        
        {/* The content area is now empty to ensure no duplicate text appears */}
        <div className="stats-content" style={{ height: '0', margin: '0' }}>
          {/* Internal elements removed: count, labels, and icons */}
        </div>
      </div>
    </div>
  );
}