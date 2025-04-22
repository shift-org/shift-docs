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
  height: auto; 
  min-width: 50px;
  border: var(--page-border);
  background-color: var(--page-bg);
  color: var(--page-text);
  padding: 0.5em;
  
  &.c-tool--enabled {
    cursor: pointer;
    @media (hover: hover) {
      &:hover {
        color: var(--page-bg);
        background-color: var(--hover-bg);
        &:active {
          color: var(--page-text);
        }
      }
    }
  }
}
.c-tool--active  {
  background-color: var(--active-bg);
  color: var(--active-text);
  border: var(--page-border-accent);
}
.c-tool--disabled {
  color: var(--disabled-text);
}

/*.c-tool__details {
  margin: 0.5em;
  padding-top: 0.5em;
  display: flex;
  justify-content: center;
  gap:  0.5em;
  font-size: 16px;
}*/
</style>