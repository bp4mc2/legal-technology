import React from 'react';
import { useLocation } from 'react-router-dom';

import { getRouteConfigForPath } from '../app/routes';
import AssistantPanel from './AssistantPanel';
import CompareTray from './layout/CompareTray';
import LeftRail from './layout/LeftRail';
import RightRail from './layout/RightRail';
import TopBar from './layout/TopBar';
import { useActiveTechnology } from './ActiveTechnologyContext';
import { useRightRail } from './rightRail/RightRailContext';
import type { RightRailState } from './rightRail/rightRailTypes';

type AppShellProps = {
  children: React.ReactNode;
};

const isTechnologyDetailPath = (pathname: string) =>
  /^\/legaltechnologies\/[^/]+$/.test(pathname) &&
  !pathname.startsWith('/legaltechnologies/compare') &&
  !pathname.startsWith('/legaltechnologies/selection');

const getScopedRailState = (
  pathname: string,
  railState: RightRailState | null,
  activeTechnology: ReturnType<typeof useActiveTechnology>['activeTechnology'],
  clearActiveTechnology: () => void,
): RightRailState | null => {
  const isTechRoute = pathname === '/legaltechnologies' || pathname.startsWith('/legaltechnologies/');
  const isDetailRoute = isTechnologyDetailPath(pathname);

  if (isDetailRoute && activeTechnology) {
    return { type: 'technologyDetail', technology: activeTechnology };
  }

  if (isTechRoute && activeTechnology) {
    return { type: 'technology', technology: activeTechnology, clearTechnology: clearActiveTechnology };
  }

  if (pathname === '/legaltechnologies' && railState?.type === 'tasktype') {
    return railState;
  }

  if (pathname === '/relations/tasks-products' && railState?.type === 'relations') {
    return railState;
  }

  if (pathname === '/capabilities' && railState?.type === 'policyCycle') {
    return railState;
  }

  return null;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const routeConfig = getRouteConfigForPath(location.pathname);
  const { activeTechnology, setActiveTechnology } = useActiveTechnology();
  const { railState } = useRightRail();

  React.useEffect(() => {
    if (location.pathname === '/legaltechnologies') {
      setActiveTechnology(null);
    }
  }, [location.pathname, setActiveTechnology]);

  const scopedRailState = getScopedRailState(
    location.pathname,
    railState,
    activeTechnology,
    () => setActiveTechnology(null),
  );

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-layout">
        <LeftRail activeSectionId={routeConfig.section} />

        <main className="app-main" id="main-content">
          {children}
          <CompareTray />
        </main>

        <RightRail state={scopedRailState} routeContext={routeConfig.context} />
      </div>
      <AssistantPanel />
    </div>
  );
};

export default AppShell;
