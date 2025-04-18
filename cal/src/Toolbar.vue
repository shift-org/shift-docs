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
  justify-content: center;
  gap: 3px;
  width: 100%;
  padding: 0.5rem 0;
}
.c-tool {
  height: auto; 
  min-width: 50px;
  border: var(--page-border);
  background-color: var(--page-background);
  color: var(--page-text);
  padding: 0.5em;
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
  background-color: #ff9819;
  border-color: #555;
}
.c-tool--disabled {
  opacity: 0.5;
}
/* see also c-menu */
.c-tool__details {
  margin: 0.5em;
  padding-top: 0.5em;
  display: flex;
  justify-content: center;
  gap:  0.5em;
  font-size: 16px;
}
</style>