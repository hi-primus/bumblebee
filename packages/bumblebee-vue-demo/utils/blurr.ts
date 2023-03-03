import type { Source } from '@/types/blurr';
import { DataframeProfile, KeyedColumn } from '@/types/dataframe';

export const PRIORITIES = {
  requirement: 1,
  previewSample: 2,
  sample: 3,
  previewProfile: 4,
  operationRequirement: 5,
  operation: 6, // modifications of the dataframe
  afterOperation: 7, // needs to be executed after an operation
  visibleProfile: 8,
  info: 9, // column insights
  profile: 10 // rest of the profile
};

export const getPreliminaryProfile = async (
  df: Source
): Promise<DataframeProfile> => {
  const columns: string[] = await df.cols.names({
    requestOptions: { priority: PRIORITIES.afterOperation }
  });
  const emptyProfile = (await df.profile({
    cols: [],
    bins: 33,
    requestOptions: { priority: PRIORITIES.afterOperation }
  })) as DataframeProfile;
  return {
    ...emptyProfile,
    columns: columns.reduce((acc, col) => {
      acc[col] = {};
      return acc;
    }, {} as Record<string, KeyedColumn>)
  };
};
