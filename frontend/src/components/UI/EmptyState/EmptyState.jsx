import React from 'react';
import { Icons } from '../../../assets/icons';
import './EmptyState.scss';

export function EmptyState({
  icon: IconComponent = Icons.FileText,
  title = 'No items found',
  subtitle = 'There is currently no data to display here.',
  action = null,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-box">
        <IconComponent size={22} strokeWidth={1.75} />
      </div>
      <h4 className="empty-state__title">{title}</h4>
      <p className="empty-state__subtitle">{subtitle}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
