<script>
// globals:
import dayjs from 'dayjs'
// components:
import Banner from './Banner.vue'
import GenericError from './GenericError.vue'
import Meta from './Meta.vue'
import Shortcuts from './Shortcuts.vue'
import { RouterLink, RouterView } from 'vue-router'
import Toolbar from './Toolbar.vue'
// support:
import siteConfig from './siteConfig.js'

export default {
  components: { Banner, GenericError, Meta, Shortcuts, RouterView, Toolbar },
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
  data() {
    return {
      // default, updated when views send pageLoaded events.
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
    menuVisible() {
      return  this.$route.query.expanded === 'menu';
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
  <Toolbar :returnLink="page.returnLink"/>
  <section class="c-cal-body">
  <div v-if="loading" class="c-cal-body__loading">Loading...</div>
  <GenericError v-else-if="error" class="c-cal-body__error" :error />
  <div class="c-cal-body__content" v-show="!loading && !error && !menuVisible">
    <RouterView @pageLoaded="pageLoaded"/>
  </div>
  <div class="c-footer" v-show="!loading">
    <div class="c-notice">
      <div>
        <div>Support your community!</div> <div>See how you can <a href="/pages/public-health/">help make bike fun safe for all</a>.</div>
      </div>
    </div>
    <div class="c-disclaimer">
      <p>SHIFT hosts this calendar as a public service. Rides and events are posted to the SHIFT calendar by community members, not by SHIFT. Rides and events posted to the SHIFT calendar are not sponsored by SHIFT or SHIFT’s fiscal sponsor Umbrella.</p>
    </div>
  </div>
  </section>
  <Shortcuts :shortcuts="shortcuts"></Shortcuts>
</template>
<!-- 
-->
<style>
.c-cal-top {
  /*border: 1px solid black;
  padding: 0.2em;
  margin: 5px 5px;*/
}
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
/** tweaked from main.css */
.c-notice {
  text-align: center;
  color: #663300;
  background: #FCFAF2;
  border: 1px solid #FFDD66;
  padding: 0.5em;
}
.c-disclaimer {
  font-size: small;
  color: #707070;
  margin: 0 auto;
  text-align: center;
  max-width: 50em;
}
</style>
