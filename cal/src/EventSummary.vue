<!-- 
  A summary of a cal daily on the calList overview page.
-->
<script>
import dayjs from 'dayjs'
// components:
import { RouterLink } from 'vue-router'
import CalTags from './CalTags.vue'
import LocationLink from './LocLink.vue'
import Term from './CalTerm.vue'
// support:
import helpers from './calHelpers.js'

export default {
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
        // the 'EventDetails' route description in calMain.js
        name: 'EventDetails', 
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
</script>
  <template>
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
</template>