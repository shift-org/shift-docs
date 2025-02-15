<script>
/**
 * QuickNav provides a row of buttons (at the bottom of a page)
 * for navigating through events, with common shortcuts 
 * for adding new events, donations, etc.
 * 
 * while most buttons are links; 
 * the left/right buttons emit: @navLeft, @navRight 
 * 
 * shortcut: { id, icon, label, (emit|url) }
 */ 
export default {
  props: {
    shortcuts: {
      type: Array,
      required: true,
    }
  },
  methods: {
    id(el) {
      return el.id;
    },
    href(el) {
    },
    // el: one of the shortcuts
    onClick(el) {
      if (el.url) {
        location.href = el.url;
      } else if (el.emit) {
        this.$emit(el.emit);
      } else {
        // maybe an exec() method on the shortcut?
        // and/or a "route" for navigating to named routes
        console.error(`nothing to do for shortcut ${el.id}`);
      }
    }
  }
}
</script>

<template>
  <div class="c-shortcuts">
  <div class="c-shortcut" v-for="el in shortcuts" :key="el.id">
    <a v-if="el.url"  class="c-shortcut__link"
      :href="el.url" 
      v-bind="el.attrs"
    >{{el.icon}}</a>
    <button v-else class="c-shortcut__button" 
      @click="onClick(el)"
      v-bind="el.attrs"
    >{{el.icon}}</button>
    <div class="c-shortcut__label">{{el.label}}</div>
  </div>
  </div>
</template>

<style>
</style>