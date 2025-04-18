<script>
// globals:
import dayjs from 'dayjs'
// components:
//
import Banner from './Banner.vue'
import Addendum from './Addendum.vue'
import GenericError from './GenericError.vue'
import JumpTool from './tools/JumpTool.vue'
import Menu from './Menu.vue'
import Meta from './Meta.vue'
import PedalPanel from './PedalPanel.vue'
import SearchTool from './tools/SearchTool.vue'
import Shortcuts from './Shortcuts.vue'
import ToolPanel from './tools/ToolPanel.vue'
import Toolbar from './Toolbar.vue'
import { RouterLink, RouterView } from 'vue-router'
// support:
import siteConfig from './siteConfig.js'
import pp from './pedalp.js'
import scrollPos from './scrollPos.js';

export default {
  components: {
    Addendum,
    GenericError, 
    Meta, 
    RouterView, 
    Shortcuts, 
    Toolbar,
    Banner,
    JumpTool, 
    Menu, 
    PedalPanel, 
    SearchTool,
    ToolPanel
  },
  mounted() {
    // listen to all router changes
    // because this.mounted() happens before the initial route is determined
    // this callback gets all of the route request including the very first one.
    this.$router.beforeEach((to, from) => {
      // when the route changes, we are loading a new (sub) page
      if (to.name !== from.name) {
        console.log(`loading ${to.name}...`);
        this.loading = true;
        this.error = null;
        if (to.name === 'EventDetails') {
          scrollPos.savePos(from);
        }
      }
    });
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
        scrollPos.restorePos(this.$route);
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
<header class="c-header">
  <Toolbar :tools="tools" :returnLink="page.returnLink"/>
  <div class="c-panels" v-show="!!expanded">
    <ToolPanel name="search" :expanded>
      <SearchTool @changeRoute="changeRoute"/>
    </ToolPanel>
    <ToolPanel name="jump" :expanded>
      <JumpTool @changeRoute="changeRoute"/>
    </ToolPanel>
    <ToolPanel name="pedalp" :expanded>
      <PedalPanel/>
    </ToolPanel>
    <ToolPanel name="menu" :expanded>
      <Menu/>
    </ToolPanel>
  </div>
</header>
<main class="c-main">
  <Banner :banner="currentBanner" :loading/>
  <div v-if="loading" class="c-cal-body__loading">Loading...</div>
  <GenericError v-else-if="error" class="c-cal-body__error" :error/>
  <!-- note: this uses 'v-show' not 'v-if': the view needs to exist to perform the loading. -->
  <div v-show="!loading && !error" class="c-cal-body__content">
    <RouterView @pageLoaded="pageLoaded"/>
    <Addendum v-show="!loading" />
  </div>
</main>
<footer class="c-footer">
  <Shortcuts :shortcuts="shortcuts"></Shortcuts>
</footer> 
</template>

<style>
.c-header {
  position: fixed;
  top: 0;
  min-height: 3.25rem;
  z-index: 250;
  width: 100%;
  max-width: var(--max-width);
  background-color: var(--fixed-bg);
  border-bottom: var(--page-border);
  display: flex;
  flex-direction: column;
}
.c-panels {
  overflow: auto;
  height: calc(100vh - 7.75rem);
  border-top: var(--page-border);
  background-color: var(--page-bg);
}
.c-divider {
  position: sticky;
  top: 3.25rem;
}
.c-main {
  padding-top: 3.25rem;
  padding-bottom: 4rem;
  width: 100%;
}
.c-footer {
  background-color: var(--fixed-bg);
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: var(--max-width);
  border-top: var(--page-border);
}
.c-cal-body, .c-single {
  padding: 0px 1em;
}
.c-cal-body__content {
  flex-grow: 1; /* take the remaining space */
}
.c-cal-body__loading::before {
  /* alt text for screen readers? */
  content: "⚙" / "";
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
