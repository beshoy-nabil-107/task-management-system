import React, { useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import './Modal.scss';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-dialog modal-dialog--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog__header">
          <h3>{title}</h3>
          <button
            type="button"
            className="modal-dialog__close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icons.X size={18} />
          </button>
        </div>

        <div className="modal-dialog__body">{children}</div>

        {footer && <div className="modal-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
