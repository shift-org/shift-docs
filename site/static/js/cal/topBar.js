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
import Toolbar from './toolbar.js'
import Menu from './menu.js'
// background-image: url("http://www.example.com/bck.png");

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
    banner() { return this.siteinfo.header.banner },
    // defined by buildMenu.html; slim/single.html 
    menu() { return  this.siteinfo.menu },
  },
  // data is a function that creates and returns .... data.
  data() {
    const q = this.$route.query;
    return {
      // passes this object to Toolbar so that we can share the 'expanded' state.
      expanded: {
        tool: q.expanded || false,
      },
    }
  },
  template: `
<header class="c-top">
  <template v-if="banner">
    <a href="banner.target"><img :alt="banner.alt" :src="banner.image" class="c-top__banner"></a>
  </template>
  <template v-else-if="title">
    <span class="c-top__title">{{ title }}</span>
  </template>
</header>
<Toolbar :expanded="expanded">
</Toolbar>
<Menu v-if="expanded.tool === 'menu'" :menu="menu">
</Menu>`,
  components: { Menu, Toolbar },
}


