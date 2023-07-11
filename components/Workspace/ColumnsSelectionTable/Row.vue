<template>
  <tr
    class="group hover:bg-primary-highlight cursor-pointer"
    :class="[isSelected ? 'text-primary-dark' : 'text-neutral-alpha']"
    @click="emit('toggle-selection')"
  >
    <td class="!py-0 !pl-4 !pr-0">
      <AppButton
        type="button"
        class="icon-button layout-invisible block min-w-4"
        :class="[isSelected ? 'color-primary-dark' : 'color-neutral-light']"
        :icon="isSelected ? mdiCheckboxMarked : mdiCheckboxBlankOutline"
        @click.stop="emit('toggle-selection')"
      />
    </td>
    <td class="!py-0 !pl-0 !pr-2">
      <AppButton
        type="button"
        class="icon-button layout-invisible block min-w-4 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        :class="[
          isHidden ? 'opacity-70' : 'opacity-0',
          isSelected ? 'color-primary-dark' : 'color-neutral-light',
          inPopup ? '' : 'size-small'
        ]"
        :icon="isHidden ? mdiEyeOff : mdiEye"
        @click.stop="emit('toggle-visibilty')"
      />
    </td>
    <td class="min-w-6">
      <ColumnTypeHint
        class="!text-current text-left"
        :data-type="getType(column) || 'unknown'"
      />
    </td>
    <td class="font-mono-table !pr-6" width="100%">
      <div class="max-w-[10em] ellipsis pl-2">
        {{ column.title }}
      </div>
    </td>
    <template v-if="inPopup">
      <td class="text-sm !pr-4 whitespace-nowrap text-right">
        {{ column.stats?.missing }} missing values
      </td>
      <td class="text-sm whitespace-nowrap text-right">
        {{ column.stats?.mismatch }} mismatch values
      </td>
    </template>
    <td class="w-4"></td>
  </tr>
</template>

<script setup lang="ts">
import {
  mdiCheckboxBlankOutline,
  mdiCheckboxMarked,
  mdiEye,
  mdiEyeOff
} from '@mdi/js';

import { Column } from '@/types/dataframe';
import { getType } from '@/utils/data-types';

defineProps({
  column: { type: Object as PropType<Column>, required: true },
  isSelected: { type: Boolean },
  isHidden: { type: Boolean },
  inPopup: { type: Boolean, default: false }
});

const emit = defineEmits(['toggle-selection', 'toggle-visibilty']);
</script>
