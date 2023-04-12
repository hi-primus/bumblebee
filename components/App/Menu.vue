<template>
  <Menu as="div" class="menu-container">
    <MenuButton as="template">
      <slot></slot>
    </MenuButton>
    <MenuItems as="ul" class="menu" :class="[attrClass]" :style="attrStyle">
      <MenuItem
        v-for="(item, index) in items"
        :key="item.text + index"
        v-slot="{ active }"
        :disabled="item.disabled"
      >
        <li
          :class="[
            'menu-item',
            active ? 'menu-itemActive' : 'menu-itemDefault'
          ]"
          @click="_e => item.action?.()"
        >
          {{ item.text }}
        </li>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>

<script lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { PropType } from 'vue';

export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
const { class: attrClass, style: attrStyle } = useAttrs();

interface MenuItemInterface {
  text: string;
  action?: () => void;
  disabled?: boolean;
}

defineProps({
  items: {
    type: Array as PropType<MenuItemInterface[]>,
    default: () => []
  }
});
</script>
