import React from 'react';
import './Loader.scss';

export function Loader({
  size = 'md', // 'sm' | 'md' | 'lg'
  text = '',
  fullscreen = false,
}) {
  return (
    <div className={`loader-container ${fullscreen ? 'loader-container--fullscreen' : ''}`}>
      <div className={`spinner spinner--${size}`} />
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
}

export default Loader;
