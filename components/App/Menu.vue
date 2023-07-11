<template>
  <Menu
    v-slot="{ open, close }"
    as="div"
    class="menu-container"
    :class="containerClass"
  >
    <MenuButton as="template" @click.prevent="open && close()">
      <slot :open="open" :close="close"></slot>
    </MenuButton>
    <MenuItems as="ul" :class="['dropdown-menu', attrClass]" :style="attrStyle">
      <slot name="menu-header" :close="close"></slot>
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
  },
  containerClass: {
    type: String,
    default: ''
  }
});
</script>
