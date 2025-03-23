<!-- 
  Provides common user actions that appear at the top of each page
 -->
<script>
//
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js'

export default {
  components: { FontAwesomeIcon },
  props: {
    returnLink: [Object, Boolean],
    tools: Object
  },
  computed: {
    expanded() {
      return this.$route.query.expanded;
    },
  },
  methods: {
    toggle(name) {
      let next;
      if (name === 'home') {
        const next = this.returnLink || {name: "events"};
        return this.$router.push(next);
      } else {
        const q = { ...this.$route.query };
        q.expanded = this.expanded != name ? name : undefined;
        return this.$router.replace({query: q})
      }
    },
    icon(key) {
      return icons.get(key);
    }
  }
}
</script>

<template>
  <!-- the toolbar buttons -->
  <div class="c-toolbar">
  <template v-for="(tool, key) in tools" :key >
    <button
      class="c-tool"
      v-if="tool" 
      :class="{
        [`c-tool__${key}`]: true,
        'c-tool--active': key === expanded,
        'c-tool--enabled': !tool.disabled,
        'c-tool--disabled': tool.disabled,
      }"
      @click="toggle(key)"><span v-if="tool.label">{{tool.label}}</span>
      <FontAwesomeIcon v-if="icon(key)" class="c-toolbar__icon" :icon="icon(key)"/>
    </button>
  </template>
  </div>
</template>
<style>
.c-toolbar {
  display: flex;
  justify-content: center;
  gap: 3px;
}
.c-tool {
  height: 35px; 
  min-width: 50px;
  border-style: solid;
  border-width: 1px;
  border-color: #ddd;
  background-color: white;
  &.c-tool--enabled {
    cursor: pointer;
    @media (hover: hover) {
        &:hover {
        color: black;
        background-color: #ffc14d; /*    --navbar-focus:  */
      } 
    }
  }
}
.c-tool--active  {
  color: white;
  background-color: #ff9819; /* orange: primary-accent */
  border-color: #555;
}
.c-tool--disabled {
  opacity: 0.5;
}
/* see also c-menu */
.c-tool__details {
  margin: 1em;
  padding: 1em;
  display: flex;
  justify-content: center;
  gap:  0.5em;
  font-size: 16px;
}
</style>