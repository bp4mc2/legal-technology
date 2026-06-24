import type { GovernancePermissions } from '../domain/governance';
import { apiFetch } from './apiClient';

export const governanceService = {
  permissions: () => apiFetch<GovernancePermissions>('/api/governance/permissions'),
};
