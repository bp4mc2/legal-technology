import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const location = useLocation();
  const linkStyle = (path: string) => ({
    marginLeft: '2rem',
    color: location.pathname === path ? '#ffd600' : 'white',
    textDecoration: 'none',
    fontWeight: location.pathname === path ? 700 : 400,
  });
  return (
    <nav style={{ background: '#1a237e', color: 'white', padding: '1rem', marginBottom: '2rem' }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Juridische Technologie Dashboard</span>
      <Link to="/" style={linkStyle('/')}>Overzicht</Link>
      <Link to="/legaltechnologies" style={linkStyle('/legaltechnologies')}>Juridische Technologieën</Link>
      <Link to="/organisations" style={linkStyle('/organisations')}>Organisaties</Link>
      <Link to="/definitions" style={linkStyle('/definitions')}>Definities</Link>
      <Link to="/assistant" style={linkStyle('/assistant')}>Assistent</Link>
    </nav>
  );
};

export default NavBar;
