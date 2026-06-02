import React from 'react';
import { Link } from 'react-router-dom';

const NavBar: React.FC = () => {
  return (
    <nav className="app-nav" aria-label="Top navigation">
      <div className="app-nav-inner">
        <span className="app-nav-brand">Wendbare Wetsuitvoering</span>
        <div className="app-nav-meta">
          <Link to="/assistant" className="app-nav-link">Fact-find</Link>
          <span className="app-role-badge">Moderator</span>
          <button type="button" className="app-proposal-button">+ Voorstel</button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
