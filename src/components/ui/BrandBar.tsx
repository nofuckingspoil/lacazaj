'use client';

import React from 'react';
import Icon from './Icon';

interface BrandBarProps {
  onInsta?: () => void;
  solid?: boolean;
  right?: React.ReactNode;
}

export default function BrandBar({ onInsta, solid = false, right }: BrandBarProps) {
  return (
    <div className={`topbar ${solid ? 'solid' : ''}`}>
      <div className="brandmark">
        <span className="lc-small">la</span>
        <span className="lc-name">La Caza J</span>
      </div>
      {right || (
        <button className="icon-btn" onClick={onInsta} aria-label="Instagram">
          <Icon name="insta" size={19} />
        </button>
      )}
    </div>
  );
}
