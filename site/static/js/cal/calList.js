/**
 * display list of events:
 * equivalent of viewEvents()
 */
// components:
import { RouterLink } from 'vue-router'
import CalTags from './calTags.js'
import LocationLink from './locLink.js'
import Term from './calTerm.js'
// support:
import siteConfig from './siteConfig.js'
import helpers from './calHelpers.js'

const Event = {
  template: `
<article 
  class="c-event"
  ref="article"
  :class="{ 'c-event--cancelled': evt.cancelled, 
            'c-event--featured': evt.featured }"
  :data-event-id="evt.caldaily_id">
<h3 class="c-event__title"><router-link 
  :to="eventLink"
>{{ evt.title }}</router-link></h3>
<dl>
  <Term type="time" label="Start Time">{{ friendlyTime }}</Term>
  <Term type="news" label="Newsflash" v-if="evt.newsflash">{{ evt.newsflash }}</Term>
  <Term type="loc" label="Location">
    <LocationLink :evt="evt"></LocationLink>
  </Term>
  <Term type="author" label="Organizer">{{ evt.organizer }}</Term>
  <Term type="tags" label="Tags">
    <CalTags :evt="evt"/>
  </Term>
</dl>
</article>
`,
  props: {
    evt: Object,
    startdate: String, // a date for returning to the same start date view.
    focused: Boolean,
  },
  mounted() {
    if (this.focused) {
      // at least in chrome, this doesn't work consistently without the timeout.
      // ( possibly because mounted() gets called directly after changing the dom. )
      setTimeout(() => this.$refs.article.scrollIntoView());
    }
  },
  components: { CalTags, LocationLink, Term },
  computed: {
    // the link uses the vue router to manipulate the url and history
    // without reloading the page.
    eventLink() {
      return {
        // the 'singleEvent' route description in calMain.js
        name: 'singleEvent', 
        // the ':caldaily_id' in that route description
        // ( which becomes pieces of the url's path )
        params: {
            caldaily_id: this.evt.caldaily_id
        }, 
        // query parameters after the path.
        // we can use the router to find the previous page
        query: {
          start: this.startdate,
        }
      };
    },
    friendlyTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    },
    mapLink() {
      return helpers.getMapLink(this.evt.address);
    }
  },
  
};

export default {
  template: `
<article 
  v-for="(day, index) in days" :key="day.date.format('YYYY-MM-DD')" 
  class="c-day"
  :data-date="day.date">
  <h2 v-if="divides(day, index, -1)" class="c-day__division c-day__division--start">
    {{fest.title}} Starts
  </h2>
  <h3>{{ longDate(day.date) }}</h3>
  <Event 
      v-for="evt in day.events" :key="evt.caldaily_id" 
      :evt="evt" 
      :focused="lastEvent === evt.caldaily_id"
      :startdate="startdate"/>
  <h2 v-if="divides(day, index, 1)" class="c-day__division c-day__division--end">
    {{fest.title}} Ends
  </h2>
</article>
`,  
  props: {
    cal: {
      // cal should contain start, end, [data]
      type: Object, 
      required: true,
    },
    // not required; scrolls to this event 
    lastEvent: [ String, null ], 
  },
  computed: {
    // the startdate as a string
    startdate() {
      return this.cal.start.format("YYYY-MM-DD");
    },
    // an array of days
    // each day containing an array of event instances ( a joined calevent + caldaily )
    days() {
      return this.cal.data;
    },
    // festival of the current year
    // if there's a winter fest that goes over the year boundary:
    // well... you'll have to code that.
    fest() {
      return siteConfig.getFestival(this.cal.start);
    },
  },
  components: { Event },
  methods: {
    longDate: helpers.longDate,

    divides(day, index, dir) {
      let okay = false;
      // don't ever put a dividing line before the first element
      if (index > 0) {
        const fest = this.fest;
        if (fest) {
          // tbd: should we be pre-building these?
          const festStart = dayjs(fest.startdate);
          const festEnd = dayjs(fest.enddate);

          // ditto dates....
          const curr = dayjs(day.date);
          const other = curr.add(dir, 'day');
          const cin = helpers.within(curr, festStart, festEnd);
          const oin = helpers.within(other, festStart, festEnd);

          // current day is within the festival; the other is outside.
          return cin && !oin;
        }
      }
      return okay
    },
  }
}
