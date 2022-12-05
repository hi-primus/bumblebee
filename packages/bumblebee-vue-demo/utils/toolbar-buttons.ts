// TODO: combine with operations / use commands instead

import {
  mdiArrowSplitVertical,
  mdiCodeTags,
  mdiMagnify,
  mdiUpload
} from '@mdi/js';

import type { Operation } from '@/types/operations';
import { operations } from '@/utils/operations';

type ToolbarButtonCreator<TA, TR> = {
  name?: string;
  label?: string;
  icon: string;
  class?: string;
  operation?: Operation<TA, TR>;
};

export type ToolbarButton<TA = any, TR = any> = SomeRequired<
  ToolbarButtonCreator<TA, TR>,
  'name'
>;

const createToolbarButton = <TA, TR>(payload: ToolbarButtonCreator<TA, TR>) => {
  const operation = payload.operation || ({} as Operation<TA, TR>);
  return {
    ...payload,
    name: payload.name || operation.name,
    label: payload.label || payload.name || operation.name,
    operation
  } as ToolbarButton<TA, TR>;
};

export const toolbarButtons = [
  {
    name: 'Load',
    label: 'Load',
    icon: mdiUpload
  },
  createToolbarButton({
    operation: operations.loadFromUrl,
    label: 'Load<br/>from url',
    icon: mdiCodeTags
  }),
  createToolbarButton({
    operation: operations.unnestColumns,
    label: 'Unnest<br/>cols.',
    icon: mdiArrowSplitVertical
  }),
  {
    name: 'Search',
    label: 'Search in<br/>workspace',
    icon: mdiMagnify,
    class: 'ml-auto'
  },
  {
    name: 'View operations',
    label: 'View<br/>operations',
    icon: mdiCodeTags
  }
];
