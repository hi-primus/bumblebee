import { ModelResponse, SelectOption } from '@/types/app';

export function getModelOptions(
  models: ModelResponse[],
  workspaceId: string
): SelectOption<string>[] {
  return models.map(model => {
    const date = new Date(model.last_updated_timestamp).toLocaleString();

    let name = model.tags.model_name || model.name;
    if (workspaceId && name.startsWith(workspaceId + '__')) {
      name = name.replace(workspaceId + '__', '');
    }
    return {
      value: model.name,
      text: `${name} (${date})`
    };
  });
}

// get latest_versions type from ModelResponse

type ModelVersion = ModelResponse['latest_versions'][0];

export function getModelVersionsOptions(
  versions: ModelVersion[]
): SelectOption<string>[] {
  return versions.map(version => ({
    value: version.version,
    text: `${version.version} (${new Date(
      version.last_updated_timestamp
    ).toLocaleString()})`
  }));
}

export function getDriftTableData(
  info: {
    metrics: {
      metric: 'DataDriftTable';
      result: {
        number_of_columns: number;
        number_of_drifted_columns: number;
        drift_by_columns: {
          column_name: string;
          drift_score: number;
          drift_detected: boolean;
        }[];
      };
    }[];
  } | null
) {
  if (!info?.metrics?.length) {
    return null;
  }

  const dataDriftTable = info.metrics.find(
    metric => metric.metric === 'DataDriftTable'
  )?.result;

  if (!dataDriftTable || !('number_of_columns' in dataDriftTable)) {
    return null;
  }

  const notDriftedColumns =
    dataDriftTable.number_of_columns - dataDriftTable.number_of_drifted_columns;

  return {
    title: 'Drift',
    topContent: `${dataDriftTable.number_of_columns} columns (${dataDriftTable.number_of_drifted_columns} drifted, ${notDriftedColumns} not drifted)`,
    header: ['Column', 'Score', 'Drift'],
    values: Object.values(dataDriftTable.drift_by_columns).map(col => [
      col.column_name,
      col.drift_score,
      col.drift_detected ? 'True' : 'False'
    ])
  };
}
