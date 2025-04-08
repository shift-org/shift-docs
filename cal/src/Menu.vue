<!-- 
 * The site menu. 
 * Mainly, it renders a menu object containing:
 * { name, url, kids: [] }
 * 
 * see also: buildMenu.html which generates a menu from the hugo.toml
-->
<script>
import siteConfig from './siteConfig.js'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js';

export default {
  components: { FontAwesomeIcon },
  props: {
    menu: {
      type: Object,
      default() {
        // defined by buildMenu.html
        return siteConfig.menu
      }
    }
  },
  computed: {
    activeMenu() { 
      return this.$route.query.menu; 
    },
    activeKids() {
      return this.menu[this.activeMenu].kids;
    }
  },
  methods: {
    toggle(id) {
      const query  = { ...this.$route.query };
      if (query.menu === id) {
        delete query.menu;
      } else {
        query.menu = id;
      }
      this.$router.replace({ query });
    },
    caretFor(id) {
      const icon = id === this.activeMenu ? 'caretDown' : 'caretRight';
      return icons.get(icon);
    }
  }
}
</script>
<template>  
<div class="c-menu">
  <ul class="c-menu__items" role="menu" id="sitemenu" aria-label="Site Menu">
    <li v-for="(menu, menu_id) in menu" :key="menu_id"
    role="presentation"
    class="c-menu-item" 
    :class="{
      [`c-menu-item--${menu_id}`]: true, 
      'c-menu-item--active': menu_id === activeMenu,
      'c-menu-item--inactive': menu_id !== activeMenu,
    }">
      <button 
          class="c-menu-item__button" 
          role="menuitem" 
          aria-haspopup="true" 
          :aria-expanded="menu_id === activeMenu"
          @click="toggle(menu_id)"
          >{{ menu.name }}
        <FontAwesomeIcon 
          class="c-menu-item__caret" 
          :icon="caretFor(menu_id)"/>
          </button>
      <template v-if="menu_id === activeMenu">
        <!-- menu content comes from json, except for 'subscribe' which is custom. -->
        <ul v-if="activeMenu !== 'subscribe'" 
            class="c-menu-item__kids"
            role="menu">
          <li v-for="(kid, kid_id) in activeKids" :key="kid_id"
          class="c-menu-kid" :class="`c-menu-kid--${kid_id}`"
          role="presentation">
            <a :href="kid.url" role="menuitem" class="c-menu-kid__link">{{kid.name}}</a>
          </li>
        </ul>
        <div v-else class="c-menu-item_kids" role="presentation">
          <div class="c-subscribe" role="menuitem">
            <p>Want to see rides using your device's calendar?</p>
            <p><a class="c-subscribe__button" href="webcal://www.shift2bikes.org/cal/shift-calendar.php">Subscribe to the Shift calendar</a></p>
            <p>If the subscribe link doesn't automatically open your calendar app, see other ways to <a href="/pages/calendar-faq/#subscribing-to-the-calendar">subscribe.</a></p>
          </div>
        </div>
      </template>
    </li>
  </ul>
</div>
</template>
<style>
.c-menu {
  display: flex;
  flex-direction: column; 
  width: 100%;
}
.c-menu__items {
  display: flex;
  justify-content: center;
  flex-direction: column;
  list-style-type: none;
  padding-inline: 0;
  margin-inline: 0;
  align-items: center;
}
.c-menu-item {
  display: flex; /* along with align-items: stretch; fills to expand vertically */
  flex-direction: column;
  text-align: center;
  width: 100%;
}
.c-menu-item__caret {
  margin-left: 0.25em;
  font-size: smaller;
}
.c-menu-item__button {
  padding: 0.5em 0;
  margin: 0;
  color: #555;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: large;
  font-weight: bold;
  &:hover {
    color: #555;
    background-color: #ffc14d;
  }
}
.c-menu-item--active .c-menu-item__button {
  background-color: #ff9819;
  color: white;
}
.c-menu-item__kids {
  list-style-type: none;
  padding-inline: 0;
  margin-inline: 0;
}
.c-menu-kid {
  border-bottom: solid 1px #eee;
  line-height: 2em;
  width: 100%;
}
.c-menu-kid__link {
  display: block;
  font-size: medium;
  padding: 0.25em;
} 
.c-subscribe {
  text-align: center;
  background: #FCFAF2;
  padding: 1em;
  margin: 0 auto;
}
.c-subscribe__button {
  color: #37b;
  font-weight: bold;
  text-transform: uppercase;
  padding: 1em;
  border-style: none;
}
</style>
