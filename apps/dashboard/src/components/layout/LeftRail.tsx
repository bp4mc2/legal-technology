import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNavSections, type NavSectionId } from '../../app/routes';

type LeftRailProps = {
  activeSectionId: NavSectionId;
};

const LeftRail: React.FC<LeftRailProps> = ({ activeSectionId }) => {
  const location = useLocation();
  const navSections = getNavSections();

  const getLinkClassName = (path: string) => {
    const isActive =
      path === '/'
        ? location.pathname === '/'
        : location.pathname === path || location.pathname.startsWith(`${path}/`);
    return `app-rail-link${isActive ? ' is-active' : ''}`;
  };

  return (
    <aside className="app-left-rail" aria-label="Primary navigation">
      {navSections.map((section) => (
        <section
          key={section.title}
          className={`app-rail-section${section.id === activeSectionId ? ' is-current-section' : ''}`}
          aria-current={section.id === activeSectionId ? 'true' : undefined}
        >
          <h3 className="app-rail-heading">{section.title}</h3>
          <div className="app-rail-links">
            {section.links.map((link) => (
              <Link key={link.to} to={link.to} className={getLinkClassName(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
};

export default LeftRail;
