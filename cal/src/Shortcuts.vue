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
  <div class="c-shortcuts">
    <ShortcutButton 
      v-for="(shortcut, name) in shortcuts" :key="name"
      :name :shortcut/>
  </div>
</template>

<style>
.c-shortcuts {
  display: flex;
  padding: 10px 0;
  /* space-evenly is nicer than gap; but not sure how to cap the maximum area on desktop */
  justify-content: center;
  gap: 10px;
  border-top: solid;
  border-color: lightgray;
  margin-top: auto; /* push this to the bottom of the page 
  https://stackoverflow.com/questions/33924655/position-last-flex-item-at-the-end-of-container */
}
</style>