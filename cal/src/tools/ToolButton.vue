<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'   
import icons from '../icons.js'

export default {
  components: { FontAwesomeIcon },
  emits: ['toggle'],
  props: {
    name: String,
    tool: Object,
    expanded: Boolean,
  },
  computed: {
    icon() {
      return icons.get(this.name);
    }
  },
  methods: {
    clicked() {
      this.$emit('toggle', this.name);
    }
  },
}
</script>
<template>
  <button
      v-if="tool" 
      class="c-tool"
      :id="`tool-button-${name}`"
      :tabindex="expanded ? 0 : -1"
      :aria-selected="expanded"
      :aria-controls="`tool-panel-${name}`"
      :class="{
        [`c-tool__${name}`]: true,
        'c-tool--active': expanded,
        'c-tool--enabled': !tool.disabled,
        'c-tool--disabled': tool.disabled,
      }"
      @click="clicked"><span v-if="tool.label">{{tool.label}}</span>
      <FontAwesomeIcon v-if="icon" class="c-toolbar__icon" :icon="icon"/>
    </button>
</template>
<style>
 
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
</style>