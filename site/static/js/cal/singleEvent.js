/**
 * display a single instance of an event on a particular day
 * for comparison see: events.html <div class="event-details">
 */
// components:
import { RouterLink } from 'vue-router'
import Banner from './banner.js'
import CalTags from './calTags.js'
import LocationLink from './locLink.js'
import Menu from './menu.js'
import QuickNav from './quickNav.js'
import Term from './calTerm.js'
import Toolbar from './toolbar.js'
// helpers
import siteConfig from './siteConfig.js'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

function formatTime(t) {
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

export default {
  template: `
<Banner :banner="banner" />
<Toolbar :expanded="expanded" />
<Menu v-if="expanded.tool === 'menu'"/>
<section class="c-single">
<router-link :to="returnLink">&lt; All Events</router-link>
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
    <Term type="author" label="Organizer">{{ evt.organizer }}</Term>
    <Term v-for="term in terms" :type="term.type" :label="term.label">{{ term.text }}</Term>
    <Term type="description" label="Description">{{ evt.details }}</Term>
  </dl>
</article>
</section>
<QuickNav @nav-left="shiftEvent(-1)" @nav-right="shiftEvent(1)"></QuickNav>
  `,
  components: { Banner, CalTags, LocationLink, Menu, QuickNav, Term, Toolbar, },
  data() {
    const { caldaily_id } = this.$route.params;
    return {
      evt: {},
      caldaily_id,
      // the toolbar wants an object with one property:
      // 'expanded' containing the name of the expanded 
      expanded: {
        tool: this.getExpanded()
      },
    }
  },
  beforeMount() {
    const { caldaily_id } = this.$route.params;
    console.log(`beforeMount event-${caldaily_id}`);
    this.fetchData(caldaily_id);
  },
  beforeRouteUpdate(to, from) {
    const { caldaily_id } = to.params;
    console.log(`beforeRouteUpdate event-${caldaily_id} ${to.fullPath}, ${from.fullPath}`);
    this.fetchData(caldaily_id);
  },
  computed: {
    banner() {
      const { evt } = this;
      return !evt || !evt.image ? siteConfig.defaultRideBanner : {
        image: evt.image,
        alt: `User-uploaded image for ${evt.title}`
      };
    },
    terms() {
      const { evt } = this;
      const startTime = formatTime(evt.time);
      const endTime = evt.endtime && formatTime(evt.endtime);
      const terms = [
        { type: "news",       label: "Newsflash", text: evt.newsflash },
        { type: "starttime",  label: "Start Time", text:  startTime },
        { type: "timedetails",label: "Time Details", text: evt.timedetails },
        { type: "endtime",    label: "End Time", text: endTime },
        { type: "locend",     label: "End Location", text: evt.locend },
        { type: "loopride",   label: "Loop", text: evt.loopride && "Ride is a loop" },
      ];
      return terms.filter(a => a.text);
    },
    startTime() {
      const { evt } = this;
      return formatTime(evt.time);
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
    // the link uses the vue router to manipulate the url and history
    // without reloading the page.
    returnLink() {
      const route = this.$route;
      const { start } = route.query;
      const { caldaily_id } = route.params;
      return {
        // the 'event' route description in calMain.js
        name: 'calendar', 
        // remove this page from history?
        replace: true,
        // the calendar doesn't have any params
        params: {},
        // query parameters after the path.
        query: {
          // to query the right stuff
          start,
          // to scroll back to this event in the view.
          // alt: store some global var with scroll position?
          // ( ex. a 'currScrollPos' var at the top of calList.js }
          at: `event-${caldaily_id}`,
        }
      };
    },
  },
  methods: {
    longDate: helpers.longDate,
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
        dataPool.getRange(range.start, range.end).then((data) => {
          // find where our event is in the returned data.
          const thisIndex = data.events.findIndex(t => t.caldaily_id === evt.caldaily_id);
          if (thisIndex < 0 || thisIndex == data.events.length) {
            // TODO: although this would be extremely rare: add some communication.
            // ( ex. maybe disable/change the buttons. )
            const directionInWords = dir > 0 ? "next" : "previous";
            console.log(`no ${directionInWords} events found`);
          } else {
            // change our current page to the the next event.
            const nextEvt = data.events[thisIndex+dir];
            this.$router.push({name: 'event', params:{caldaily_id: nextEvt.caldaily_id}});
          }
        });
      }
    },
    // query a single day
    async fetchData(caldaily_id) {
      const evt = await dataPool.getDaily(caldaily_id);
      this.evt = evt;
    }
  }
}