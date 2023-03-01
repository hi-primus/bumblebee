import type { Source } from '@/types/blurr';
import { DataframeProfile, KeyedColumn } from '@/types/dataframe';

export const getPreliminaryProfile = async (
  df: Source
): Promise<DataframeProfile> => {
  const columns: string[] = await df.cols.names();
  const emptyProfile = await df.profile({ cols: [], bins: 33 });
  return {
    ...emptyProfile,
    columns: columns.reduce((acc, col) => {
      acc[col] = {};
      return acc;
    }, {} as Record<string, KeyedColumn>)
  };
};
