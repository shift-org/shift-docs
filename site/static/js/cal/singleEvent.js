/**
 * ideally:
 * 
 * [ ] put the image up top if any.
 * [x] < All Events back button
 * [x] TIME | **TITLE**
 * location icon ( and link? ) location info
 * person icon and info
 * convo icon - meet at
 * loop icon -- and text ( ride is a loop )
 * COVID, ETC TAGS
 * location description
 * event description [ image float? ]
 * 
 */

import { RouterLink } from 'vue-router'
import dataPool from './dataPool.js'

export default {
  
  mounted() {
    //this.prevpage= this.$router.options.history.state.back;

    // hides the pp-promo-banner ( pp-banner ) and the "calendar" header
    // tbd: but it doesn't do it quickly enough when you refresh the page.
    document.body.classList.add('collapsed');
    this.fetchData(this.$route.params.caldaily_id);
  },
  beforeUnmount() {
    document.body.classList.remove('collapsed');
  },
  data() {
    return {
      evt: null,
    }
  },
   computed: {
    startTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    }
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
  <router-link :to="{name:'calendar'}">&lt; All Events</router-link>
  <template v-if="evt">
  <h4><span class="startTime">{{startTime}}</span> | 
  <span class="title">{{evt.title}}</span></h4>
  </template>
  `
}

