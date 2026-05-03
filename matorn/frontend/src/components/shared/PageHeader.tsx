// /frontend/src/components/shared/PageHeader.tsx
import React, { ReactNode } from 'react';
import './shared.css';

interface PageHeaderProps {
  title:       string;
  count?:      number;
  countLabel?: string;
  onAdd?:      () => void;
  addLabel?:   string;
  addIcon?:    ReactNode;  // ← ReactNode c'est le bon type ici
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  count,
  countLabel,
  onAdd,
  addLabel,
  addIcon,
}) => (
  <div className="page-header">

    <div className="page-header__left">
      <h1 className="page-header__title">{title}</h1>
      {count !== undefined && countLabel && (
        <span className="page-header__count">
          {count} {countLabel}{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>

    {onAdd && (
      <button className="page-header__btn-add" onClick={onAdd}>
        {addIcon}
        {addLabel}
      </button>
    )}

  </div>
);

export default PageHeader;