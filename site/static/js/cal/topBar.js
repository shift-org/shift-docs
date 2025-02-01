/**
 * top of the page, including logo, header, and menu.
 */
import Toolbar from './toolbar.js'
import Menu from './menu.js'
import siteConfig from './siteConfig.js'

export default {
  props: {
    // see siteConfig.js and buildPedalDates.html
    banner: Object, // image, target, title, alt?
  },
  computed: {
    // defined by buildMenu.html; events/single.html 
    menu() { return siteConfig.menu },
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
    <a :href="banner.target"><img :alt="banner.alt" :src="banner.image" class="c-top__banner"></a>
  </template>
  <template v-else-if="banner.title">
    <span class="c-top__title">{{ banner.title }}</span>
  </template>
</header>
<section class="c-mid">
<Toolbar :expanded="expanded">
</Toolbar>
<Menu v-if="expanded.tool === 'menu'" :menu="menu">
</Menu>
</section>
`,
  components: { Menu, Toolbar },
}