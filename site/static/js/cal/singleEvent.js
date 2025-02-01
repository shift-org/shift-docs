
import { RouterLink } from 'vue-router'
import dataPool from './dataPool.js'

export default {

  data() {
    return {
      evt: null,
    }
  },
  computed: {
    startTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    },
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
    async fetchData(caldaily_id) {
      const evt = await dataPool.getDaily(caldaily_id);
      this.evt = evt;
      // note: main.js sets
      // const title= event.title;
      // const desc = event.printdescr || event.details.substring(0,250);              
      // $('meta[property="og:title"]')[0].setAttribute("content", title);
      // $('meta[property="og:description"]')[0].setAttribute("content", desc);
      // document.title = title + " - Calendar - " + SITE_TITLE;
    }
  },
  template: `
  <router-link :to="returnLink">&lt; All Events</router-link>
  <template v-if="evt">
  <h4><span class="startTime">{{startTime}}</span> | 
  <span class="title">{{evt.title}}</span></h4>
  </template>
  `
}

