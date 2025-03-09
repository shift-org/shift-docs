<!-- 
  Provides common user actions that appear at the top of each page
 -->
<script>
//
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import JumpTool from './tool/JumpTool.vue'
import SearchTool from './tool/SearchTool.vue'
//
import icons from './icons.js'

export default {
  components: { FontAwesomeIcon, JumpTool, SearchTool },
  props: {
    // a dict with a single member: 'tool',
    // set to the name of the tool to show.
    // ( this allow the expanded object to be shared
    //   and the name of the tool to be poked into it; read elsewhere. )
    expanded: Object,    
  },
  computed: {
    menuIcon() {
      return icons.get('menu');
    },
    currentTool() {
      return this.expanded.tool;
    }
  },
  data() {
    return {
      // name of tool and label
      tools: {
        search: "Search",
        jump: "Jump To Date",
        pedalp: "Pedalpalooza"
      }
    };
  },
  methods: {
    toggle(name) {
      const q = { ...this.$route.query };
      if (!name || name === this.expanded.tool) {
        this.expanded.tool = false;
        q.expanded = undefined;
      } else {
        this.expanded.tool = name;
        q.expanded = name;
      }
      return this.$router.replace({query: q});
    },
    changeRoute(target) {
      // call toggle to collapse the bar before navigating away
      this.toggle().then(() => {
        this.$router.push(target);
      });
    }
  }
}
</script>

<template>
  <div class="c-toolbar">
    <slot></slot>
    <button v-for="(label, tool) in tools" :key="tool" 
    class="c-tool"
    :class="{'c-tool--active': tool === currentTool}"
    @click="toggle(tool)">{{label}}</button>
    <button 
    class="c-tool c-tool__menu" 
    :class="{'c-tool--active': 'menu' === currentTool}"
    @click="toggle('menu')">
    <FontAwesomeIcon class="c-toolbar__icon" :icon="menuIcon"/>
  </button>
</div>
<!--  -->
<SearchTool class="c-tool__details" v-if="currentTool == 'search'"  @changeRoute="changeRoute" />
<!--  -->
<JumpTool class="c-tool__details" v-else-if="currentTool == 'jump'"  @changeRoute="changeRoute" />
<!--  -->
<template class="c-tool__details" v-else-if="currentTool == 'pedalp'" />
</template>
<style>
.c-toolbar {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.c-tool  {
  height: 35px; 
  min-width: 50px;
  border-style: solid;
  border-width: 1px;
  border-color: #ddd;
  background-color: white;
}
@media (hover: hover) {
 .c-tool:hover {
    color: white;
    background-color: #ff9819; /*var(--primary-accent);*/
    cursor: pointer;
  } 
}
.c-tool--active  {
  color: white;
  background-color: #ff9819;
  border-color: darkgrey;
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