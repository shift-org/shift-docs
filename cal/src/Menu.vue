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
      const q = this.$route.query;
      return q.menu;  
    },
    activeKids() {
      return this.menu[this.activeMenu].kids;
    }
  },
  methods: {
    activate(name) {
      const q = { ...this.$route.query };
      if (q.menu === name) {
        delete q.menu;
      } else {
        q.menu = name;
      }
      this.$router.replace({query: q});
    },
    caretFor(name) {
      const icon = name === this.activeMenu ? 'caretDown' : 'caretRight';
      return icons.get(icon);
    }
  }
}
</script>
<template>  
<div class="c-menu">
  <ul class="c-menu__items">
    <li v-for="(menu, menu_id) in menu" :key="menu_id"
    class="c-menu__item" 
    :class="{
      [`c-menu__item--${menu_id}`]: true, 
      'c-menu__item--active': menu_id === activeMenu,
      'c-menu__item--inactive': menu_id !== activeMenu,
    }">
      <h3 class="c-menu__button" @click="activate(menu_id)">{{ menu.name }}
        <FontAwesomeIcon 
          class="c-menu__caret" :icon="caretFor(menu_id)" 
          />
      </h3>
      <template v-if="menu_id === activeMenu">
        <ul v-if="activeMenu !== 'subscribe'" class="c-menu__kids">
          <li v-for="(kid, kid_id) in activeKids" :key="kid_id"
          class="c-menu__kid" :class="`c-menu__kid--${kid_id}`">
            <a :href="kid.url" class="c-menu__link">{{kid.name}}</a>
          </li>
        </ul>
        <div v-else class="c-menu__kids">
          <div class="c-subscribe">
            <p>Want to see rides using your device's calendar?</p>
            <p><a class="c-subscribe__button" href="webcal://www.shift2bikes.org/cal/shift-calendar.php">Subscribe to the Shift calendar</a></p>
            <p>If the subscribe link doesn't automatically open your calendar app, see other ways to <a href="/pages/calendar-faq/#subscribing-to-the-calendar">subscribe.</a>.</p>
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
}
.c-menu__button {
  text-align: center;
}
.c-menu__caret {
  margin-left: 0.25em;
  font-size: smaller;
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
.c-menu__item {
  display: flex; /* along with align-items: stretch; fills to expand vertically */
  flex-direction: column;
  width: 100%;
}
.c-menu__button {
  cursor: pointer;
  padding: 0.5em 0;
  margin: 0;
  color: #555;
  &:hover {
    background-color: #ffc14d;
  }
}
.c-menu__item--active .c-menu__button {
  background-color: #ff9819;
}
.c-menu__kids {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  list-style-type: none;
  text-align: center;
  padding-inline: 0;
  margin-inline: 0;
}
.c-menu__kid {
  text-align: center;
  padding: 1em 0em;
  border-bottom: solid 1px #eee;
  width: 100%;
} 
/*  fix? currently using CalMain's c-notice; probably should create some vars for the colors and reuse those colors here. */
.c-subscribe {
  width: 90%;
  text-align: center;
  background: #FCFAF2;
  padding: 1em;
  margin: 1em auto;
}
.c-subscribe__button {
  color: #37b;
  font-weight: bold;
  text-transform: uppercase;
  padding: 1em;
  border-style: none;
}
</style>
