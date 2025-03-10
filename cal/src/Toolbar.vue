<!-- 
  Provides common user actions that appear at the top of each page
 -->
<script>
//
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js'
//
import JumpTool from './tools/JumpTool.vue'
import Menu from './Menu.vue'
import SearchTool from './tools/SearchTool.vue'


export default {
  components: { FontAwesomeIcon, JumpTool, Menu, SearchTool },
  props: {
    returnLink: [Object, Boolean],
  },
  computed: {
    currentTool() {
      return this.$route.query.expanded;
    },
    // in computed so it can change per path
    tools() {
      const route = this.$route; 
      const hideHome = route.name === "events" && !route.query.start;
      return {
        home: { 
          icon: icons.get('home'), 
          disabled: hideHome,
        },
        search: {
          label: "Search",
        },
        jump: {
          label: "Jump"
        },
        pedalp: {
          label: "Pedalpalooza"
        },
        menu: {
          icon: icons.get('menu')
        },
      };
    }
  },
  methods: {
    toggle(name) {
      let next;
      if (name === 'home') {
        const next= this.returnLink || {name: "events"};
        return this.$router.push(next);
      } else {
        const q = { ...this.$route.query };
        q.expanded = this.currentTool != name ?  name : undefined;
        return this.$router.replace( {query: q})
      }
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
  <!-- the toolbar buttons -->
  <div class="c-toolbar">
  <template v-for="(tool, key) in tools" :key >
    <button
      class="c-tool"
      :class="{
        [`c-tool__${key}`]: true,
        'c-tool--active': key === currentTool,
        'c-tool--enabled': !tool.disabled,
        'c-tool--disabled': tool.disabled,
      }"
      @click="toggle(key)"><span v-if="tool.label">{{tool.label}}</span>
      <FontAwesomeIcon v-if="tool.icon" class="c-toolbar__icon" :icon="tool.icon"/>
    </button>
  </template>
  </div>
  <!-- the tool panels -->
  <SearchTool class="c-tool__details" v-if="currentTool === 'search'"  @changeRoute="changeRoute" />
  <!--  -->
  <JumpTool class="c-tool__details" v-else-if="currentTool === 'jump'"  @changeRoute="changeRoute" />
  <!--  -->
  <template class="c-tool__details" v-else-if="currentTool === 'pedalp'" />
  <Menu v-else-if="currentTool === 'menu'"/>
</template>
<style>
.c-toolbar {
  display: flex;
  justify-content: center;
  gap: 10px;
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
.xc-tool__home {
  position: absolute;
  left: 1em;
  font-size: small;
}
.xc-tool__menu {
  position: absolute;
  right: 1em;
  font-size: small;
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