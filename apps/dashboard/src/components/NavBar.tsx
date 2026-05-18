import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const location = useLocation();

  const getLinkClassName = (path: string) => (
    `app-nav-link${location.pathname === path ? ' is-active' : ''}`
  );

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        <span className="app-nav-brand">Juridische Technologie Dashboard</span>
        <div className="app-nav-links">
          <Link to="/" className={getLinkClassName('/')}>Overzicht</Link>
          <Link to="/legaltechnologies" className={getLinkClassName('/legaltechnologies')}>Juridische Technologieën</Link>
          <Link to="/tasktypes" className={getLinkClassName('/tasktypes')}>Taaktypen</Link>
          <Link to="/organisations" className={getLinkClassName('/organisations')}>Organisaties</Link>
          <Link to="/definitions" className={getLinkClassName('/definitions')}>Definities</Link>
          <Link to="/stickynotes" className={getLinkClassName('/stickynotes')}>Sticky Notes</Link>
          <Link to="/assistant" className={getLinkClassName('/assistant')}>Assistent</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
