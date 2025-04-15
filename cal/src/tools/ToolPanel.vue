<script>
export default {
  props: {
    name: String,
    expanded: String,
  },
  computed: {
    id() {
      return `tool-panel-${this.name}`;
    },
    // the html uses 'hidden' because that's the mdn recommendation for accessibility
    hidden() {
      return this.expanded !== this.name;
    },
    toolButton() {
      return `tool-button-${this.name}`;
    },
  },
}
</script>
<template>
<div class="c-tool__panel"  
    :id="id" 
    tabindex="0"
    :aria-labeledby="toolButton"
    v-show="!hidden"
    :hidden>
  <slot></slot>
</div>
</template>

<style>
/* see also c-menu */
.c-tool__panel {
  margin: 0.5em;
  padding-top: 0.5em;
  display: flex;
  justify-content: center;
  gap:  0.5em;
  font-size: 16px;
}
</style>