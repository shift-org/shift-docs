<script>
/**
 * The site menu. 
 * Mainly, it renders a menu object containing:
 * { name, url, kids: [] }
 * 
 * see also: buildMenu.html which generates a menu from the hugo.toml
 * 
 * while it's possible to define a recursive vue template,
 * this keeps things simple and kids can't have kids.
 */
import siteConfig from './siteConfig.js'

export default {
  props: {
    "menu": {
      type: Object,
      default() {
        // defined by buildMenu.html
        return siteConfig.menu
      }
    }
  },
  computed: {
    submenu() {
      const q = this.$route.query;
      return q.menu;  
    }
  },
  methods: {
    toggle(name) {
      const q = { ...this.$route.query };
      q.menu = (name !== this.submenu) ? name : undefined;
      this.$router.replace({query: q});
    }
  }
}
</script>

<template>  
<div class="c-menu">
  <ul class="c-menu__items">
    <li v-for="(menu, menu_id) in menu" :key="menu_id">
      <button @click="toggle(menu_id)">{{ menu.name }}</button>
      <ul v-if="submenu === menu_id">
        <li v-for="(kid, kid_id) in menu.kids" :key="kid_id">
          <a :href="kid.url">{{kid.name}}</a>
        </li>
      </ul>
    </li>
  </ul>
  <div class="c-notice c-subscribe">
    <p>Want to see rides using your computer or phone's calendar app?</p>
    <p><button type="button" class="c-subscribe__button" data-url="webcal://www.shift2bikes.org/cal/shift-calendar.php">Subscribe to the Shift calendar feed</button></p>
    <p>If that doesn't open your calendar app, see <a href="/pages/calendar-faq/#subscribing-to-the-calendar">other ways to subscribe to the calendar</a>.</p>
  </div>
</div>
</template>

<style>
/* see also c-tools__details 
   fix? move menu to part of the toolbar?
*/
.c-menu {
  margin: 1em;
/*  padding: 1em;*/
}
/*  fix? currently using CalMain's c-notice; probably should create some vars for the colors and reuse those colors here. */
.c-subscribe {
  margin: 1em;
}
.c-subscribe__button {
  color: #37b;
  background: #efefef;
  font-weight: bold;
  text-transform: uppercase;
  padding: 1em;
  border-style: none;
}
</style>