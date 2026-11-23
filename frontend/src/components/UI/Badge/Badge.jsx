import React from 'react';
import './Badge.scss';

export function Badge({
  children,
  variant, // If omitted, normalized from children string
  showDot = true,
  className = '',
}) {
  const normalizeVariant = (val) => {
    if (!val) return 'neutral';
    const clean = String(val).toLowerCase().replace(/[\s_-]/g, '');
    if (clean === 'pending') return 'pending';
    if (clean === 'inprogress') return 'inprogress';
    if (clean === 'pendingreview') return 'pendingreview';
    if (clean === 'completed') return 'completed';
    if (clean === 'approved') return 'approved';
    if (clean === 'delayed') return 'delayed';
    if (clean === 'rejected') return 'rejected';
    if (clean === 'high') return 'high';
    if (clean === 'medium') return 'medium';
    if (clean === 'low') return 'low';
    if (clean === 'manager') return 'manager';
    if (clean === 'teamleader') return 'team_leader';
    if (clean === 'member') return 'member';
    return 'neutral';
  };

  const resolvedVariant = variant ? String(variant).toLowerCase() : normalizeVariant(children);

  return (
    <span className={`badge badge--${resolvedVariant} ${className}`}>
      {showDot && <span className="badge__dot" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
