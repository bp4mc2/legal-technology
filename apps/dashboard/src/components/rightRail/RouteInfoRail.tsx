import React from 'react';
import { Link } from 'react-router-dom';
import type { RouteContext } from '../../app/routeContext';

const RouteInfoRail: React.FC<{ context: RouteContext }> = ({ context }) => (
  <>
    {context.cards.map((card) => (
      <div key={card.title} className="app-context-card">
        <h3 className="app-context-title">{card.title}</h3>
        <p className="app-context-copy">{card.copy}</p>
        {card.links && card.links.length > 0 ? (
          <div className="app-context-links">
            {card.links.map((link) => (
              <Link key={link.to} to={link.to} className="app-context-link">
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    ))}
  </>
);

export default RouteInfoRail;
