<template>
  <v-menu offset-y left min-width="200" >
    <template v-slot:activator="{ on: more }">
      <v-icon v-on="more" class="bb-menu" color="black" @click.stop="">more_vert</v-icon>
    </template>
    <v-list flat dense>
      <v-list-item-group color="black">
        <template
          v-for="(item, i) in items"
        >
          <v-divider
            v-if="item.divider"
            :key="i"
          />
          <v-list-item
            v-else-if="item.link"
            :href="item.link"
            target="_blank"
            :key="i"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            v-else
            :key="i"
            @click="item.click"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  }
}
</script>
