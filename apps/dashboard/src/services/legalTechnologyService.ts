import type { EnumerationGroup, TaskType } from '../domain/taskTypes';
import type { LegalTechnology, LegalTechnologySummary } from '../domain/legalTechnology';
import { apiFetch } from './apiClient';

export const legalTechnologyService = {
  listTaskTypes: () => apiFetch<TaskType[]>('/api/legaltechnologies/tasktypes'),
  listEnumerations: () => apiFetch<EnumerationGroup[]>('/api/legaltechnologies/enumerations'),
  search: (query = '') => apiFetch<LegalTechnologySummary[]>(`/api/legaltechnologies/search?q=${encodeURIComponent(query)}`),
  get: (id: string) => apiFetch<LegalTechnology>(`/api/legaltechnologies/${encodeURIComponent(id)}`),
  delete: (id: string) => apiFetch(`/api/legaltechnologies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
