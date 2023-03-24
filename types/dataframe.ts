import type { Source } from './blurr';
import type { PreviewType } from './operations';

export type FrequencyValue = { count: number; value: BasicType };

export type HistValue = { count: number; lower: number; upper: number };

export type Highlight = boolean | 'error' | 'warning' | 'success';

export interface ColumnStats {
  match: number;
  missing: number;
  mismatch: number;
  count_uniques?: number;
  frequency?: FrequencyValue[];
  hist?: HistValue[];
  inferred_data_type?: { data_type: string; categorical: boolean } | string;
}

export interface KeyedColumn {
  data_type?: string;
  stats?: ColumnStats;
}

export interface Column extends KeyedColumn {
  displayTitle?: string;
  title: string;
}

export interface PreviewColumn {
  columnType: 'default' | 'highlight' | 'highlighted' | 'preview';
  highlight?: Highlight;
}

export type ColumnHeader = Column & PreviewColumn;

export interface DataframeSummary {
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

export interface PreviewOptions {
  usesInputDataframe?: boolean;
}

export interface PreviewData {
  columns?: Record<string, PreviewColumn>;
  df?: Source;
  profile?: DataframeProfile;
  options?: PreviewOptions;
  type: PreviewType;
}

export interface DataframeObject {
  name?: string;
  df: Source;
  sourceId: string;
  profile?: DataframeProfile;
  updates?: number;
}
