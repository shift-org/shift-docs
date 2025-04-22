<script>
/**
 * Shortcuts provides a row of buttons (at the bottom of a page)
 * for navigating through events, with common shortcuts 
 * for adding new events, donations, etc.
 */ 
import ShortcutButton from './ShortcutButton.vue';

export default {
  components: { ShortcutButton },
  props: {
    shortcuts: {
      type: Object,
      required: true,
    }
  },
}
</script>

<template>
  <div class="c-shortcuts"
  aria-label="Shortcuts">
    <ShortcutButton 
      v-for="(shortcut, name) in shortcuts" :key="name"
      :name :shortcut/>
  </div>
</template>

<style>
.c-shortcuts {
  display: flex;
  padding: 10px 0;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>