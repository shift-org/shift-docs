<!-- 
  Provides common user actions that appear at the top of each page
 -->
<script>
import ToolButton from './tools/ToolButton.vue'

export default {
  components: { ToolButton },
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
        const query = { ...this.$route.query };
        query.expanded = this.expanded != name ? name : undefined;
        return this.$router.replace({query});
      }
    },
  }
}
</script>

<template>
  <!-- the strip of toolbar buttons.
      https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tab_role#example
  -->
  <div class="c-toolbar">
  <template v-for="(tool, name) in tools" :key="name" area-label="Site Tools">
    <ToolButton
      :name 
      :tool 
      :expanded="
      name===expanded"
      @toggle="toggle"/>
  </template>
  </div>
</template>
<style>

.c-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  height: 3.25rem; /* matches the c-divider sticky position */
}
</style>