<script>
// globals:
import dayjs from 'dayjs'
// components:
//
import Banner from './Banner.vue'
import Footer from './Footer.vue'
import GenericError from './GenericError.vue'
import JumpTool from './tools/JumpTool.vue'
import Menu from './Menu.vue'
import Meta from './Meta.vue'
import PedalPanel from './PedalPanel.vue'
import SearchTool from './tools/SearchTool.vue'
import Shortcuts from './Shortcuts.vue'
import Toolbar from './Toolbar.vue'
import { RouterLink, RouterView } from 'vue-router'
// support:
import siteConfig from './siteConfig.js'
import pp from './pedalp.js'

export default {
  components: {
    Footer,
    GenericError, 
    Meta, 
    RouterView, 
    Shortcuts, 
    Toolbar,
    Banner,
    JumpTool, 
    Menu, 
    PedalPanel, 
    SearchTool  
  },
  mounted() {
    // listen to all router changes
    // because this.mounted() happens before the initial route is determined
    // this callback gets all of the route request including the very first one.
    this.$router.beforeEach((to, from) => {
      // when the route changes, we are loading a new (sub) page
      // tbd: but not when query parameters change?
      // fix: might want to block quick nav left/right.
      if (to.name !== from.name) {
        console.log("loading...");
        this.loading = true;
        this.error = null;
      }
    });
  },

  beforeRouteLeave(to, from) {
    console.log("beforeRouteLeave???");
    // called when the route that renders this component is about to be navigated away from.
    // As with `beforeRouteUpdate`, it has access to `this` component instance.
    delete to.query.expaned;
    return to;
  },
  data() {
    return {
      // default, updated when views emit pageLoaded events.
      page: siteConfig.defaultPageInfo,
      // shows loading spinner
      loading: false,
      // critical errors, if any.
      error: null,
      // for the bottom nav panel:
      shortcuts: [],
    }
  },
  computed: {
    // used for browser bar title
    fullTitle() {
      return this.page.title || siteConfig.title;
    },
    currentBanner() {
      return !this.error ? this.page.banner : siteConfig.defaultListBanner;
    },
    expanded() {
      return this.$route.query.expanded;
    }, 
    // in computed so it can change per path
    tools() {
      const route = this.$route; 
      const hideHome = route.name === "events" && !route.query.start && !route.query.expanded;
      // 
      return {
        home: { 
          disabled: hideHome,
        },
        search: {
          label: "Search",
        },
        jump: {
          label: "Jump"
        },
        pedalp: !pp.show ? undefined : {
          label: `Pedalpalooza ${pp.currentYear}`
        },
        menu: {},
      };
    }
  },
  methods: {
    // custom event sent by the each of the subviews 
    // ( after they've loaded their data for a given url. )
    pageLoaded(context, error) {
      this.loading = false; // stop displaying the spinning icon
      if (error) {
        // alt: could redirect to 404 style page.
        // ( the only problem would be how to parameterize the page with the error string
        // ( could pass it as a query string? or is that too messy? )
        this.error = error;
      } else {
        this.page = context.page; // matches the format of siteConfig.defaultPageInfo
        this.shortcuts = context.shortcuts;
      }
    },
    // removes the "expanded" tool before jumping away
    changeRoute(target) {
      delete target.query.expanded;
      this.$router.replace(target);
    }
  }
}

</script>
<!-- 
  The page is largely the same for every route:
  only the center swaps out.
 -->
<template>
  <Meta :title="fullTitle" />
  <Meta name="description" :content="page.desc" />
  <!--  -->
  <Meta property="og:type" content="website" />
  <Meta property="og:title" :content="page.title" />
  <Meta property="og:description" :content="page.desc" />
  <!--  -->
  <Banner :banner="currentBanner" :loading/>
  <Toolbar :tools="tools" :returnLink="page.returnLink"/>
  <div v-if="loading" class="c-cal-body__loading">Loading...</div>
  <GenericError v-else-if="error" class="c-cal-body__error" :error/>
  <!-- note: this uses 'v-show' not 'v-if': the view needs to exist to perform the loading. -->
  <div v-show="!loading && !error" class="c-cal-body__content">
    <SearchTool class="c-tool__details" v-if="expanded === 'search'" @changeRoute="changeRoute"/>
    <JumpTool class="c-tool__details" v-else-if="expanded === 'jump'" @changeRoute="changeRoute"/>
    <PedalPanel v-else-if="expanded === 'pedalp'"/>
    <Menu v-else-if="expanded === 'menu'"/>
    <div v-show="!expanded">
      <RouterView @pageLoaded="pageLoaded"/>
    </div>
    <Footer v-show="!loading" />
  </div>
  <!--  -->
  <Shortcuts :shortcuts="shortcuts"></Shortcuts>
</template>
<!-- 
-->
<style>
.c-cal-body, .c-single {
  padding: 0px 1em;
}
.c-cal-body__content {
  overflow-y: auto;
}
.c-cal-body__loading::before {
  content: "⚙";
  position: absolute;
  font-size: 50px;
  animation: spin 4s linear infinite;
  margin: 20px;
}
@keyframes spin { 
  100% { 
    transform: rotate(360deg); 
  }
}
</style>
