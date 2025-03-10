<script>
/**
 * display a single instance of an event on a particular day
 * for comparison see: events.html <div class="event-details">
 */
// globals:
import dayjs from 'dayjs'
// components:
import CalTags from './CalTags.vue'
import DateDivider from './DateDivider.vue'
import EventHeader from './EventHeader.vue'
import ExternalLink from './ExternalLink.vue'
import LocationLink from './LocLink.vue'
import Term from './CalTerm.vue'
// helpers
import { buildPage } from './eventDetails.js'
import calTags from './calTags.js'
import dataPool from './support/dataPool.js'
import helpers from './calHelpers.js'

function formatTime(t) {
  // note: parsing the time this way requires the customParseFormat
  return dayjs(t, 'hh:mm:ss').format('h:mm A');
}

export default {
  components: { CalTags, DateDivider, EventHeader, ExternalLink, LocationLink, Term },
  emits: [ 'pageLoaded' ],
  // before the component is fully created
  // determine our slug and redirect to the proper url
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    // fetch the requested caldaily 
    const { series_id, caldaily_id, slug } = to.params;
    console.log(`EventDetails beforeRouteEnter id: ${caldaily_id} slug: ${slug}`);
    return dataPool.getDaily(caldaily_id).then((evt) => {
      // validate/update the slug:
      const wantSlug = helpers.slugify(evt);
      if (slug !== wantSlug) {
        // next() can redirect to a path or location object.
        console.log(`requesting redirect to slug ${wantSlug}`);
        next({
          name: to.name,
          params: {
            series_id,
            caldaily_id,
            slug: wantSlug,
          }
        });
      } else {
        // next() can also take a callback
        // which is called after the component is created.
        // 'vm' is 'this' component.
        next(vm => {
          // record the event data
          // and remember the calendar start
          if (from.name === 'events') {
            const q = from.query;
            if (q.start) {
              vm.calStart = q.start;
            }
          }
          // done loading.
          const page = buildPage(evt, vm.calStart, to.fullPath);
          vm.evt = evt; 
          vm.$emit("pageLoaded", page);
        });
      }
    }).catch((error) => {
      console.warn("event loading error:", error);
      next(vm => {
        vm.$emit("pageLoaded", null, error);
      });
    });
  },
  // triggered when naving left/right through days
  beforeRouteUpdate(to, from) { 
    console.log(`EventDetails beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
    const { caldaily_id, slug } = to.params;
    return dataPool.getDaily(caldaily_id).then((evt) => {
      const page = buildPage(evt, this.calStart, to.fullPath);
      this.evt = evt; 
      this.$emit("pageLoaded", page);
    }).catch((error) => {
      console.warn("event loading error:", error);
      this.$emit("pageLoaded", null, error);
    });
  },
  data() {
    return {
      // placeholder empty event data
      evt: {},
      // the week we came from
      calStart: null,
    };
  },
  computed: {
    tags() {
      return calTags.buildEventTags(this.evt)
    },
    startTime() {
      return formatTime(this.evt.time);
    },
    timeRange() {
      return helpers.getTimeRange(this.evt);
    },
    loopText() {
      return this.evt.loopride && 'Ride is a loop';
    }
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
  },
  methods: {
    webLink(evt) {
      return helpers.getWebLink(evt.weburl);
    },
    contactLink(evt) {
      return helpers.getContactLink(evt.contact);
    },
  }
}
</script>
<!--  -->
<template>
  <DateDivider :date="evt.date"></DateDivider>
  <article 
    :data-event-id="evt.caldaily_id"
    class="c-detail"
    :class="{ 'c-detail--cancelled': evt.cancelled, 
              'c-detail--featured': evt.featured }">
    <EventHeader class="c-detail__header" :featured="evt.featured" :time="startTime">
      {{evt.title}}
    </EventHeader>
    <dl class="c-terms c-detail__terms">
      <Term id="tags" label="Tags">
        <CalTags :tags/>
      </Term>
      <Term id="location" label="Location">
        <LocationLink :evt="evt"></LocationLink>
      </Term>
      <Term id="organizer"  label= "Organizer">
          <span class="c-organizer__name c-organizer__name--link" v-if="contactLink(evt)">
            <ExternalLink :href="contactLink(evt)">{{evt.organizer}}</ExternalLink>
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
      </Term>
      <Term id="news"       label= "Newsflash"    :text="evt.newsflash"/>
      <Term id="time"       label= "Start Time"   :text="timeRange"/>
      <Term id="timedetails"label= "Time Details" :text="evt.timedetails"/>
      <Term id="locend"     label= "End Location" :text="evt.locend"/>
      <Term id="loop"       label= "Loop"         :text="loopText"/>
    </dl>
    <dl class="c-terms c-detail__footer">
      <Term id="desc" label= "Description" :text="evt.details"/>
      <Term v-if="evt.weburl" label="More Info">
        <ExternalLink :href="webLink(evt)">
          {{evt.webname || evt.weburl}}
        </ExternalLink>
      </Term> 
    </dl>
  </article>
</template>

<style>
.c-detail {
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-wrap: nowrap;
} 
.c-detail--featured {
  background-color: #fcfaf2;
  border: 1px solid #fd6;
  padding: 0px 1em;
}
.c-detail--cancelled {
  .c-header {
    text-decoration: line-through;
  }
  /* strike through the values of things, except for the news and the tags */
  .c-term__value:not(.c-term__value--news, .c-term__value--tags) {
    text-decoration: line-through;
  }
}
.c-terms {
  margin: 0px;
}
.c-term__value--desc {
  margin: 1em;
  white-space: pre-line;
}
</style>