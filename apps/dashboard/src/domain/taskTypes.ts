export type TaskType = {
  iri?: string;
  label: string;
  description?: string;
  group_iri?: string;
  group_label?: string;
  group_order?: number;
  task_order?: number;
};

export type EnumerationGroup = {
  name: string;
  values: string[];
};
