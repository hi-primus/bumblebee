export interface ColumnStats {
  match: number;
  missing: number;
  mismatch: number;
  frequency?: object[];
  hist?: object[];
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
