<script>
/**
 * display a single instance of an event on a particular day
 * for comparison see: events.html <div class="event-details">
 */
// globals:
import dayjs from 'dayjs'
// components:
import { RouterLink } from 'vue-router'
import Banner from './Banner.vue'
import CalTags from './CalTags.vue'
import LocationLink from './LocLink.vue'
import Menu from './Menu.vue'
import Meta from './Meta.vue'
import QuickNav from './QuickNav.vue'
import Term from './CalTerm.vue'
import Toolbar from './Toolbar.vue'
// helpers
import siteConfig from './siteConfig.js'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

function formatTime(t) {
  // parsing the time this way requires the customParseFormat
  // ( loaded by siteConfig )
  return dayjs(t, 'hh:mm:ss').format('h:mm A');
}

// given a date and a direction
// return a start and end pair
function makeRange(date, dir) {
  const daysToFetch = 7;
  if (dir < 0) {
    // start in the past, ending at date.
    const start = date.subtract(daysToFetch-1, 'day');
    return { start, end: date };
  } else if (dir > 0) {
    // start at date, end in the future.
    const end = date.add(daysToFetch, 'day');
    return { start: date, end };
  } else {
    throw new Error("expected valid direction for makeRange");
  }
}

// future improve by not chopping words?
function sliceWords(str, size = 250) {
  return str.length <= size ? str : str.substring(0, size) + "…";
}

export default {
  components: { Banner, CalTags, LocationLink, Menu, Meta, QuickNav, Term, Toolbar, },
  data() {
    return {
      evt: {},
      calStart: null,
      // the toolbar wants an object with one property:
      // 'expanded' containing the name of the expanded 
      expanded: {
        tool: this.getExpanded()
      },
    };
  },
  // before the page is rendered...
  // 'to' and 'from' are 'Route'(s).
  // note: a valid 'this' doesn't exist during beforeRouteEnter
  beforeRouteEnter(to, from, next) {
    // fetch the requested caldaily 
    const { caldaily_id, slug } = to.params;
    console.log(`beforeRouteEnter id: ${caldaily_id} slug: ${slug}`);
    dataPool.getDaily(caldaily_id).then((evt) => {
      // validate/update the slug:
      const wantSlug = helpers.slugify(evt);
      if (slug !== wantSlug) {
        // next can use a path or location object.
        console.log(`requesting redirect to slug ${wantSlug}`);
        next({
          name: to.name,
          params: {
            caldaily_id,
            slug: wantSlug,
          }
        });
      } else {
        // next can also take a callback:
        // 'vm' is the component's 'this'.
        next(vm => {
          vm.evt = evt; 
          // and remember the calendar start
          if (from.name === 'calendar') {
            const q = from.query;
            if (q.start) {
              vm.calStart = q.start;
            }
          }
        });
      }
    });
  },
  computed: {
    banner() {
      const { evt } = this;
      return !evt || !evt.image ? siteConfig.defaultRideBanner : {
        image: evt.image,
        alt: `User-uploaded image for ${evt.title}`
      };
    },
    pageTitle() {
      const { evt } = this;
      return `${(evt.tinytitle || evt.title)} - Calendar - ${siteConfig.title}`;
    },
    // https://github.com/shift-org/shift-docs/blob/652af30e3c3a4d623a34ff0ff43ead9d671f2320/site/themes/s2b_hugo_theme/assets/js/cal/main.js#L68
    pageDesc() {
      const { evt } = this;
      return evt.printdescr || sliceWords(evt.details || evt.title || "");
    },
    terms() {
      const { evt } = this;
      const startTime = formatTime(evt.time);
      const endTime = evt.endtime && formatTime(evt.endtime);
      const terms = [
        { id: "organizer",  label: "Organizer", text: evt.organizer },
        { id: "news",       label: "Newsflash", text: evt.newsflash },
        { id: "starttime",  label: "Start Time", text:  startTime },
        { id: "timedetails",label: "Time Details", text: evt.timedetails },
        { id: "endtime",    label: "End Time", text: endTime },
        { id: "locend",     label: "End Location", text: evt.locend },
        { id: "loopride",   label: "Loop", text: evt.loopride && "Ride is a loop" },
        { id: "desc",       label: "Description", text: evt.details },
      ];
      return terms.filter(a => a.text);
    },
    startTime() {
      const { evt } = this;
      return formatTime(evt.time);
    },
    // for the bottom nav panel:
    shortcuts() { 
      const { evt } = this;
      return [{
        id: "prev",
        icon: "⇦",
        label: "Previous",
        emit: "navRight"
      },{
        id: "next",
        icon: "⇨",
        label: "Next",
        emit: "navLeft"
      },{
        id: "add",
        icon: "+",
        label: "Add",
        url:"/addevent/"
      },{
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
        // activate the sharing api?
        // const shareData = {
        //   title: "MDN",
        //   text: "Learn web development on MDN!",
        //   url: "https://developer.mozilla.org",
        // };
        id: "share",
        icon: "⤴", 
        label: "Share",
        url: `${this.$route.fullPath}`,
        attrs: {
          rel: "bookmark"
        }
      },{
        id: "export",
        icon: "⤵",
        label: "Export",
        // FIX: neither this nor the calendar version works
        // also... shouldn't this be a single day export not all of them?
        url: `/api/ics.php?id=${evt.id}`
      },{
        id: "favorites",
        icon: "☆",
        label: "Favorites"
      }];
    },
    // an example of generating :aria-describedby with "newflash" and "featured"
    // describedBy() {
    //   const { caldaily_id } = this;
    //   // list of event properties to check
    //   const members = [ "featured", "newsflash" ];
    //   // filter out that are empty in the event data
    //   // and convert the remaining ones to the member name + id.
    //   const out = members.filter(n => this.evt[n])
    //                      .map(n => n + caldaily_id);
    //   // returning undefined hides the html attr
    //   return out.length ? out.join(" ") : undefined;
    // },
    //
    // a link to return to the list of all events.
    returnLink() {
      const start = this.calStart || undefined;
      return {
        // the named route pageDesc from cal/main.js
        name: 'calendar', 
        // remove this page from history?
        replace: true,
        // the calendar doesn't have any params
        params: {},
        // query parameters after the path.
        query: {
          // to query the right stuff upon returning.
          start,
        }
      };
    },
  },
  methods: {
    longDate: helpers.longDate,
    webLink(evt) {
      return helpers.getWebLink(evt.weburl);
    },
    contactLink(evt) {
      return helpers.getContactLink(evt.contact);
    },
    // returns which toolbar tool ( or menu section ) is visible:
    getExpanded() {
      // default to 'false' if expanded isn't part of the query.
      const { expanded = false } = this.$route.query;
      return expanded;
    },
    // shift today left (-1) or right (1) by a single day.
    // currently, this queries a week of data to figure out what's before/after.
    // TODO: make the server always return prev/next ids as part of pagination for a single event.
    shiftEvent(dir) {
      const { evt } = this;
      if (!evt.date) {
        // to-do: disable buttons until the current event's data has loaded.
        console.log("can't browse dates until the date is valid");
      } else {
        // ask for a range of events before or after the current event.
        const range = makeRange(dayjs(evt.date), dir);
        // ( see also: shiftEvent )
        dataPool.getRange(range.start, range.end).then((data) => {
          // find where our event is in the returned data.
          const thisIndex = data.events.findIndex(t => t.caldaily_id === evt.caldaily_id);
          if (thisIndex < 0 || thisIndex == data.events.length) {
            // TODO: although this would be extremely rare: add some communication.
            // ( ex. maybe disable/change the buttons. )
            const directionInWords = dir > 0 ? "next" : "previous";
            console.log(`no ${directionInWords} events found`);
          } else {
            // change our current view to the the next event.
            // ( the router won't reload the page b/c we're already here! )
            const nextEvt = data.events[thisIndex+dir];
            const caldaily_id = nextEvt.caldaily_id;
            const slug = helpers.slugify(evt);
            this.$router.push({name: 'EventDetails', params: {caldaily_id, slug} });
            this.evt = nextEvt; 
          }
        });
      }
    },
  }
}
</script>

<template>
  <Meta :title="pageTitle" />
  <Meta name="description" :content="pageDesc" />
  <!--  -->
  <Meta property="og:title" :content="evt.title" />
  <Meta property="og:description" :content="pageDesc" />
  <Meta property="og:type" content="website" />
  <Meta property="og:image" :content="banner.image" />
  <!-- excludes image:width and height; we don't know them and since we aren't providing multiple
  sites can't pick between them based on size -->
  <Banner :banner/>
  <Toolbar :expanded>
    <router-link :to="returnLink" class="c-toolbar__special">&lt; All Events</router-link>
  </Toolbar>
  <Menu v-if="expanded.tool === 'menu'"/>
  <article 
    class="c-single"
    :class="{ 'c-single--cancelled': evt.cancelled, 
              'c-single--featured': evt.featured }"
    :data-event-id="evt.caldaily_id">
    <h3 class="c-single__date">{{longDate(evt.date)}}</h3>
    <h3 class="c-single__title">
        <span class="c-single__time">{{startTime}}</span>
        <span class="c-single__words">{{evt.title}}</span>
    </h3>
    <dl>
      <Term type="tags" label="Tags">
        <CalTags :evt="evt"/>
      </Term>
      <Term type="loc" label="Location">
        <LocationLink :evt="evt"></LocationLink>
      </Term>
      <Term v-for="term in terms" :type="term.id" :label="term.label" :key="term.id">
        <template v-if="term.id != 'organizer'">
        {{ term.text }}
        </template>
        <template v-else>
          <span class="c-organizer__name c-organizer__name--link" v-if="contactLink(evt)">
            <a  href="contactLink(evt)" target="_blank" rel="noopener nofollow external" 
            title="Opens in a new window">{{evt.organizer}}
            </a>
          </span>
          <span v-else class="c-organizer__name c-organizer__name--text">
            {{ evt.organizer }}
          </span>
          <span v-if="evt.email"
            class="c-organizer__phone"
          >(<a :href="'mailto:' + evt.email">{{evt.email}}</a>)</span>
          <span v-if="evt.phone"
            class="c-organizer__phone"
          >(<a :href="'tel:' + evt.phone">{{evt.phone}}</a>)</span>
        </template>
      </Term>    
      <Term v-if="evt.weburl" label="More Info">
        <a :href="webLink(evt)" target="_blank" rel="noopener nofollow external" title="Opens in a new window">
          {{evt.webname || evt.weburl}}
        </a>
      </Term>
    </dl>
  </article>
  <QuickNav :shortcuts="shortcuts" @nav-left="shiftEvent(-1)" @nav-right="shiftEvent(1)"></QuickNav>
</template>

<style>
</style>