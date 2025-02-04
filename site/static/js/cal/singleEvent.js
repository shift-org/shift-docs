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
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

// an example of swapping b/t <del> and <span>
// "slot" is the content of <DelSpan>SLOT CONTENT</DelSpan>
// const DelSpan = {
// template: `<component :is="htmlEl"><slot></slot></component>`,
//   computed: {
//     htmlEl() {
//       return this.deleted ? "del" : "span";
//     }
//   },
//   props: {
//     deleted: {
//       type: Boolean,
//       required: true,
//     }
//   }
// };

function formatTime(t) {
  return dayjs(t, 'hh:mm:ss').format('h:mm A');
}

// TODO:
// additional contact info -- which is at the end of the page 
// share link
// export to caledar 
// add the lower nav bar? -- should next and prev go to the next event in the day?
// do you want the menu bar? -- you could keep it the same, with a new button "back to all events' or you could put that link under the menu bar.



// <p class="contactInfo">
//             <a href="https://ridewithgps.com/routes/31874092" target="_blank" rel="noopener nofollow external" title="Opens in a new window">
//               <svg class="icon" role="img" aria-label="Website"><use href="#icon-website"></use><title>Website</title></svg>
//               Route           
//             </a>
//           </p>

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
<QuickNav @nav-left="shiftRange(-1)" @nav-right="shiftRange(1)"></QuickNav>
  `,
  components: { Banner, CalTags, LocationLink, Menu, QuickNav, Term, Toolbar, },
  data() {
    const { caldaily_id } = this.$route.params;
    return {
      evt: {},
      caldaily_id,
      banner: {
        alt: "Default image for a community organized ride.",
        image: "/img/banner_bikes_city.jpg"
      },
      // the toolbar wants an object with one property:
      // 'expanded' containing the name of the expanded 
      expanded: {
        tool: this.getExpanded()
      },
    }
  },
  beforeMount() {
    const { caldaily_id } = this;
    console.log(`beforeMount of the singleEvent requesting caldaily_id ${caldaily_id}`);
    this.fetchData(caldaily_id);
  },
  computed: {
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
      const { startdate, enddate } = route.query;
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
          startdate,
          // probably doesn't exist
          enddate,
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
    getExpanded() {
      // default to 'false' if expanded isn't part of the query.
      const { expanded = false } = this.$route.query;
      return expanded;
    },
    async fetchData(caldaily_id) {
      const evt = await dataPool.getDaily(caldaily_id);
      this.evt = evt;
      if (evt.image) {
        this.banner.image = evt.image;
        this.banner.alt = `User-uploaded image for ${evt.title}`;
      }
    }
  }
}

