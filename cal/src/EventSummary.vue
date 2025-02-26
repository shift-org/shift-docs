<!-- 
  A summary of a cal daily on the calList overview page.
-->
<script>
import dayjs from 'dayjs'
// components:
import { RouterLink } from 'vue-router'
import CalTags from './CalTags.vue'
import EventHeader from './EventHeader.vue'
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
  components: { CalTags, EventHeader, LocationLink, Term },
  computed: {
    // the link uses the vue router to manipulate the url and history
    // without reloading the page.
    eventDetailsLink() {
      const { evt } = this;
      return {
        // the 'EventDetails' route description in cal/main.js
        name: 'EventDetails', 
        // the ':caldaily_id' in that route description
        // ( which becomes pieces of the url's path )
        params: {
            caldaily_id: evt.caldaily_id,
            slug: helpers.slugify(evt)
        }
      };
    },
    friendlyTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    },
    mapLink() {
      return helpers.getMapLink(this.evt.address);
    },
    tags() {
      return helpers.buildEventTags(this.evt)
    }
  },
};
</script>
  <template>
  <article 
    ref="article"
    :data-event-id="evt.caldaily_id"
    class="c-event"
    :class="{ 'c-event--cancelled': evt.cancelled, 
              'c-event--featured': evt.featured }">
  <EventHeader :featured="evt.featured">
    <router-link :to="eventDetailsLink">{{ evt.title }}</router-link>
  </EventHeader>
  <dl>
    <Term type="time" label="Start Time">{{ friendlyTime }}</Term>
    <Term type="news" label="Newsflash" v-if="evt.newsflash">{{ evt.newsflash }}</Term>
    <Term type="loc" label="Location">
      <LocationLink :evt="evt"></LocationLink>
    </Term>
    <Term type="organizer" label="Organizer">{{ evt.organizer }}</Term>
    <Term type="tags" label="Tags">
      <CalTags :tags="tags" />
    </Term>
  </dl>
  </article>
</template>
<style>
.c-event--featured {
  background-color: #fcfaf2;
  border: 1px solid #fd6;
  padding: 0px 1em;
}
.c-event--cancelled {
  .c-header {
    text-decoration: line-through;
  }
  /* strike through the values of things, except for the news and the tags */
  .c-term__value:not(.c-term__value--news, .c-term__value--tags) {
    text-decoration: line-through;
  }
}
</style>