import type { Source } from 'blurr/build/main/types';

import { DataframeProfile, KeyedColumn } from '@/types/dataframe';

export const preliminaryProfile = async (
  df: Source
): Promise<DataframeProfile> => {
  const emptyProfile = await df.profile({ cols: [], bins: 33 });
  const columns: string[] = await df.cols.names();
  return {
    ...emptyProfile,
    columns: columns.reduce((acc, col) => {
      acc[col] = {};
      return acc;
    }, {} as Record<string, KeyedColumn>)
  };
};
