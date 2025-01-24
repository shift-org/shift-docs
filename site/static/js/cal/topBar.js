/**
 * top of the page, including logo, header, and menu.
 */

// expects a two level deep block of json
// a slice containing { name, kids }
// where kids is a slice of { name, url }
//
// using button but the original uses:
// <a @click="toggle(menu.name)" role="button" aria-haspopup="true" :aria-expanded="expanded === menu.name">{{ menu.name }}</a>
//
const Menu = {
  template: `
<ul>
<li v-for="menu in menus">
  <button @click="toggle(menu.name)">{{ menu.name }}</button>
  <ul v-if="expanded === menu.name">
    <li v-for="kid in menu.kids">
      <a :href="kid.url">{{kid.name}}</a>
    </li>
  </ul>
</li>
</ul>
`,  
  props: {
    "menus": Object,
  },
  data() {
    return {
      expanded: ""
    }
  },
  methods: {
    toggle(name) {
      if (name === this.expanded) {
        this.expanded = "";
      } else {
        this.expanded = name;
      }
    }
  }
}

export default {
  props: {
    siteinfo: {
      type: Object,
      required: true 
    }
  },
  computed: {
    logo() { return this.siteinfo.header.logo },
    title() { return this.siteinfo.header.title },
    menus() { return  this.siteinfo.menus },
  },
  // data is a function that creates and returns .... data.
  data() {
    return {
      // passes this object to Menu so that we can share the 'expanded' state.
      menu: {
        expanded: false,
      }
    }
  },
  methods: {
    clickedMenuButton() {
      this.menu.expanded = !this.menu.expanded;
    }
  },
  template: `
<header class="c-top">
  <svg class="c-top--logo" role="img" aria-hidden="true" width="100" height="55" viewBox="0 0 206 112">
    <use :href="logo"/>
  </svg>
  <span class="c-top--title">{{ title }}</span>
  <button class="c-top--hamburger" @click="clickedMenuButton">&equiv;</button>
</header>
<Menu v-if="menu.expanded" :menus="menus">
</Menu>`,
  components: { Menu },
}


