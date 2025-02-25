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
    // unfortunately, the text-decoration style can't be turned off 
    // for a child element; and we want the newsflash to be easily readable
    // so each term supports cancellation instead.
    // the caltags 
    cancelled() {
      return this.evt.cancelled
    },
    tags() {
      return helpers.buildEventTags(this.evt)
    }
  },
};
</script>
  <template>
  <article 
    class="c-event"
    ref="article"
    :class="{ 'c-event--cancelled': cancelled, 
              'c-event--featured': evt.featured }"
    :data-event-id="evt.caldaily_id">
  <h3 class="c-event__title" :class="{'c-event__title--cancelled': cancelled}"><router-link 
    :to="eventDetailsLink"
  >{{ evt.title }}</router-link></h3>
  <dl>
    <Term type="time" label="Start Time" :cancelled>{{ friendlyTime }}</Term>
    <Term type="news" label="Newsflash" v-if="evt.newsflash">{{ evt.newsflash }}</Term>
    <Term type="loc" label="Location" :cancelled>
      <LocationLink :evt="evt"></LocationLink>
    </Term>
    <Term type="author" label="Organizer" :cancelled>{{ evt.organizer }}</Term>
    <Term type="tags" label="Tags">
      <CalTags :tags="tags" />
    </Term>
  </dl>
  </article>
</template>
<style>
.c-event__title--cancelled {
  text-decoration: line-through;
}
</style>