<script>
/**
 * renders a menu object containing:
 * { id, name, url, kids: [] )
 * 
 * see also: buildMenu.html which generates a menu from the hugo.toml
 * 
 * while it's possible to define a recursive vue template,
 * this keeps things simple and kids can't have kids.
 */
// support:
import siteConfig from './siteConfig.js'

export default {
  props: {
    // if not specified, falls back to the siteConfig
    "menu": {
      type: Object,
      default(rawProps) {
        // defined by buildMenu.html
        return siteConfig.menu
      }
    }
  },
  data() {
    const q = this.$route.query;
    return {
      expanded: q.menu || false
    }
  },
  methods: {
    toggle(name) {
      const q = { ...this.$route.query };
      if (name === this.expanded) {
        this.expanded = false;
        q.menu = undefined;
      } else {
        this.expanded = name;
        q.menu = name;
      }
      this.$router.replace({query: q});
    }
  }
}
</script>

<template>  
  <ul>
  <li v-for="menu in menu" :key="menu.id">
    <button @click="toggle(menu.id)">{{ menu.name }}</button>
    <ul v-if="expanded === menu.id">
      <li v-for="kid in menu.kids" :key="kid.id">
        <a :href="kid.url">{{kid.name}}</a>
      </li>
    </ul>
  </li>
  </ul>
</template>

<style>
</style>