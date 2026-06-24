import React from 'react';
import type { RouteContext } from '../../app/routeContext';
import type { RightRailState } from '../rightRail/rightRailTypes';
import RelationsRail from '../rightRail/RelationsRail';
import RouteInfoRail from '../rightRail/RouteInfoRail';
import TasktypeRail from '../rightRail/TasktypeRail';
import { TechnologyDetailRail, TechnologyRail } from '../rightRail/TechnologyRail';
import PolicyCycleRail from '../rightRail/PolicyCycleRail';

type RightRailProps = {
  state: RightRailState | null;
  routeContext: RouteContext;
};

const resolveHeader = (state: RightRailState | null, routeContext: RouteContext) => {
  if (state?.type === 'technology' || state?.type === 'technologyDetail') {
    return { heading: state.technology.naam, subtitle: 'Geselecteerde technologie' };
  }
  if (state?.type === 'relations') {
    return { heading: 'Taken -> Producten', subtitle: 'Route-specifieke context voor taak-product analyse' };
  }
  if (state?.type === 'policyCycle') {
    return { heading: 'Beleidscyclus', subtitle: 'Toon extra context op taakkaarten' };
  }
  return { heading: routeContext.title, subtitle: routeContext.subtitle };
};

const RightRail: React.FC<RightRailProps> = ({ state, routeContext }) => {
  const { heading, subtitle } = resolveHeader(state, routeContext);

  return (
    <aside className="app-right-rail" aria-label="Context panel">
      <header className="app-context-header">
        <h2 className="app-context-heading">{heading}</h2>
        <p className="app-context-subtitle">{subtitle}</p>
      </header>

      {state?.type === 'tasktype' ? (
        <TasktypeRail context={state.context} commands={state.commands} />
      ) : state?.type === 'relations' ? (
        <RelationsRail context={state.context} commands={state.commands} />
      ) : state?.type === 'policyCycle' ? (
        <PolicyCycleRail context={state.context} commands={state.commands} />
      ) : state?.type === 'technologyDetail' ? (
        <TechnologyDetailRail technology={state.technology} />
      ) : state?.type === 'technology' ? (
        <TechnologyRail technology={state.technology} clearTechnology={state.clearTechnology} />
      ) : (
        <RouteInfoRail context={routeContext} />
      )}
    </aside>
  );
};

export default RightRail;
