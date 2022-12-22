import type { Source } from 'blurr/build/main/types';

export type FrequencyValue = { count: number; value: BasicType };

export type HistValue = { count: number; value: [number, number] };

export interface ColumnStats {
  match: number;
  missing: number;
  mismatch: number;
  frequency?: FrequencyValue[];
  hist?: HistValue[];
  inferred_data_type?: { data_type: string; categorical: boolean } | string;
}

export interface KeyedColumn {
  data_type?: string;
  stats?: ColumnStats;
}

export interface Column extends KeyedColumn {
  title: string;
}

export interface DataframeSummary {
  summary: number;
  data_types_list: string[];
  total_count_data_types: number;
  cols_count: number;
  rows_count: number;
  missing_count: number;
  p_missing: number;
}

export interface DataframeProfile {
  columns: Record<string, KeyedColumn>;
  summary: DataframeSummary;
  name?: string;
  file_name?: string;
}

export interface DataframeObject {
  name?: string;
  df: Source;
  profile?: DataframeProfile;
  updates: number;
}
