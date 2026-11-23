import React from 'react';
import './Button.scss';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md'
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  icon = null,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full-width' : ''} ${
        loading ? 'btn--loading' : ''
      } ${className}`}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {!loading && icon && <span className="btn__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export default Button;
