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
      menu: {
        type: Object,
        default() {
          // defined by buildMenu.html
          return siteConfig.menu
        }
      }
    },
    data() {
      return {
        defaultMenu: "subscribe",
      }
    },
    computed: {
      activeMenu() {
        const q = this.$route.query;
        return q.menu || this.defaultMenu;  
      },
      activeKids() {
        return this.menu[this.activeMenu].kids;
      }
    },
    methods: {
      activate(name) {
        const q = { ...this.$route.query };
        q.menu = name;
        this.$router.replace({query: q});
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
          <button class="c-menu__button" @click="activate(menu_id)">{{ menu.name }}</button>
        </li>
      </ul>
    <ul v-if="activeMenu !== 'subscribe'" 
        class="c-menu__kids">
      <li v-for="(kid, kid_id) in activeKids" :key="kid_id"
       class="c-menu__kid" :class="`c-menu__kid--${kid_id}`">
        <a :href="kid.url" class="c-menu__link">{{kid.name}}</a>
      </li>
    </ul>
    <div v-else class="c-menu__kids">
      <div class="c-subscribe">
        <p>See rides using your device's calendar?</p>
        <p><a class="c-subscribe__button" href="webcal://www.shift2bikes.org/cal/shift-calendar.php">Subscribe to the Shift calendar</a></p>
        <p>If clicking the above link doesn't open your calendar app, see other ways to <a href="/pages/calendar-faq/#subscribing-to-the-calendar">subscribe.</a>.</p>
      </div>
    </div>
    </div>
    
  </template>

  <style>
  
  .c-menu {
    margin: 0em 20px;
    display: flex;
    flex-direction: column;    
  }
  .c-menu__items {
    display: flex;
    justify-content: center;
    flex-direction: row;
    list-style-type: none;
    padding-inline: 0; /* for chrome, resets the ul's indentation */
    gap: 0.5em;
    margin-block-end: 0; /* space below the tabs */
    align-items: stretch;
  }
  .c-menu__item {
    display: flex; /* along with align-items: stretch; fills to expand vertically */
    z-index: 100;
  }
  .c-menu__item--inactive {
    z-index: 1;
  }
  .c-menu__button {
    position: relative;
    border: thin;
    padding: 5px;
    border-radius:  5px 5px 0 0;
    border-style: solid;
    border-bottom-width: 0;
    border-color: #FFDD66;
    font-size: larger;
    cursor: pointer;
  }
  .c-menu__item--active .c-menu__button {
    background: #FCFAF2;
    color: #ff9819;
  }
  .c-menu__item--inactive .c-menu__button {
    opacity: 0.4;
  }
  .c-menu__kids {
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    padding-inline: 0;
    margin-inline: 0;
    margin-top: -1px;
    background: #FCFAF2;
    border: 1px solid #FFDD66;
    border-radius:  5px;
    text-align: center;
    position: relative; 
    z-index: 10;
  }
  .c-menu__kid {
    width: calc(50% - 20px); /* https://www.geeksforgeeks.org/how-to-arrange-two-items-per-row-using-flexbox */
    text-align: center;
    padding: 5px;
  } 
  /*  fix? currently using CalMain's c-notice; probably should create some vars for the colors and reuse those colors here. */
  .c-subscribe {
    width: 100%;
    text-align: center;
  }
  .c-subscribe__button {
    color: #37b;
    font-weight: bold;
    text-transform: uppercase;
    padding: 1em;
    border-style: none;
  }
  </style>
