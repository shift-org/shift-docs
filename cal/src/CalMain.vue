<script>
// globals:
import dayjs from 'dayjs'
// components:
import Banner from './Banner.vue'
import Menu from './Menu.vue'
import Meta from './Meta.vue'
import QuickNav from './QuickNav.vue'
import { RouterLink, RouterView } from 'vue-router'
import Toolbar from './Toolbar.vue'
// support:
import siteConfig from './siteConfig.js'

export default {
  components: { Banner, Menu, Meta, QuickNav, RouterView, Toolbar },
  mounted() {
    this.$router.beforeEach((to, from) => {
      // when the route changes, we are loading a new page
      // tbd: but not when query parameters change?
      // fix: might want to block quick nav left/right.
      if (to.name !== from.name) {
        console.log("loading...");
        this.loading = true;
      }
    });
  },
  data() {
    return {
      // default, updated when views send pageLoaded events.
      page: siteConfig.defaultPageInfo,
      // shows loading spinner
      loading: false,
      // critical errors, if any.
      error: null,
      // given to the Toolbar.
      // contains the name of the expanded tool or menu.
      expanded: {
        // default to 'false' if expanded isn't part of the query.
        tool: this.$route.query.expanded || false,
      },
      // for the bottom nav panel:
      shortcuts: [],
    }
  },
  computed: {
    // used for browser bar title
    fullTitle() {
      return this.page.title || siteConfig.title;
    },
  },
  methods: {
    // custom event sent by the each of the subviews 
    // ( after they've loaded their data for a given url. )
    pageLoaded(context, error) {
      this.loading = false; // stop displaying the spinning icon
      if (error) {
        this.error = error; // if any; alt could redirect to 404 style page.
      } else {
        this.page = context.page; // matches the format of siteConfig.defaultPageInfo
        this.shortcuts = context.shortcuts;
      }
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
  <Meta property="og:image" :content="page.banner.image" />
  <!-- note: excludes og:image:width,height; we don't know them and since we aren't providing multiple
  sites can't pick between them based on size -->
  <!--  -->
  <Banner :banner="page.banner" :loading/>
  <Toolbar :expanded="expanded">
      <RouterLink v-if="page.returnLink" :to="page.returnLink.target" class="c-toolbar__backlink">{{page.returnLink.label}}</RouterLink>
  </Toolbar>
  <Menu v-if="expanded.tool === 'menu'"/>
  <section class="c-cal-body">
  <div v-if="loading" class="c-cal-body__loading">Loading...</div>
  <div v-else-if="error" class="c-cal-body__error">{{ error }}</div>
  <div class="c-cal-body__content" v-show="!loading">
    <RouterView @pageLoaded="pageLoaded"/>
  </div>
  </section>
  <QuickNav :shortcuts="shortcuts"></QuickNav>
</template>
<!-- 
-->
<style>
.c-cal-body, .c-single {
  flex-grow: 1;
  overflow: auto;
  padding: 0px 1em;
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
