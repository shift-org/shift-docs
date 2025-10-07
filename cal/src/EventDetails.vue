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
            const { start } = from.query;
            if (start) {
              vm.calStart = start;
            }
          }
          // done loading.
          const page = buildPage(evt, vm.calStart, to.fullPath);
          vm.evt = evt; 
          // override the server's shareable with the spa's current page.
          evt.shareable = window.location;
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
    // at page load, we don't know much other than
    // series, daily, and maybe the slug
    const { caldaily_id } = this.$route.params;
    return {
      // placeholder empty event data
      // 'id' will become valid when loading is finished
      evt: {
        caldaily_id,
      },
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
    },
    rideLength() {
      if (this.evt.ridelength) {
        return `${this.evt.ridelength} miles`;
      }
    },
    shareableLink() {
      return this.evt.shareable;
    },
    exportLink()  {
      // FIX: this matches the calendar but should be a single day.
      const { series_id } = this.$route.params;
      return dataPool.getExportURL(series_id);
    },
    addToGoogleLink() {
      const { evt } = this;
      return evt.id && helpers.getAddToGoogleLink(evt);
    },
    webLink() {
      const { evt } = this;
      return evt.id && helpers.getWebLink(evt.weburl);
    },
    contactLink() {
      const { evt } = this;
      return evt.id && helpers.getContactLink(evt.contact);
    }
  }
}
</script>
<!--  -->
<template>
  <DateDivider :date="evt.date"></DateDivider>
  <article 
    :data-event-id="evt.caldaily_id"
    :id="`cal-${evt.caldaily_id}`" 
    class="c-detail"
    :class="{ 'c-detail--cancelled': evt.cancelled, 
              'c-detail--featured': evt.featured }">
    <EventHeader class="c-detail__header" :id="evt.caldaily_id" :featured="evt.featured" :time="startTime" :hasNews="!!evt.newsflash">
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
          <span class="c-organizer__name c-organizer__name--link" v-if="contactLink">
            <ExternalLink :href="contactLink">{{evt.organizer}}</ExternalLink>
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
      <Term id="news" :context="evt.caldaily_id" label= "Newsflash" :text="evt.newsflash"/>
      <Term id="time"       label= "Start Time"   :text="timeRange"/>
      <Term id="timedetails"label= "Time Details" :text="evt.timedetails"/>
      <Term id="locend"     label= "End Location" pretext="Ending at " :text="evt.locend"/>
      <Term id="loop"       label= "Loop"         :text="loopText"/>
      <Term id="ridelength" label= "Length"       :text="rideLength"/>
      <Term v-if="evt.weburl" label="More Info">
        <ExternalLink :href="webLink">
          {{evt.webname || evt.weburl}}
        </ExternalLink>
      </Term> 
    </dl>
    <p class="c-description">
      {{evt.details}}
    </p>
    <ul class="c-detail-links" v-if="evt.id">
      <li><a :href="shareableLink" class="c-links__share" rel="bookmark">Sharable link</a></li>
      <li><a :href="exportLink" class="c-links__export">Export to calendar</a></li>
      <li><a :href="addToGoogleLink" class="c-links__google" target="_blank">Add to Google Calendar</a></li>
    </ul>
  </article>
</template>

<style>
.c-detail {
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-wrap: nowrap;
  margin: 5px 10px;
} 
.c-detail--featured {
  background-color: var(--feature-bg);
  border: var(--orangey-border);
  padding: 1em;
}
.c-detail--cancelled {
  .c-event-header {
    text-decoration: line-through;
  }
  /* strike through the values of things, except for the news and the tags */
  .c-term__value:not(.c-term__value--news, .c-term__value--tags) {
    text-decoration: line-through;
  }
}
.c-terms {
  margin: 0px;
  padding: 0px 1em;
}
.c-description {
  white-space: pre-line;
  border-top: var(--orangey-border);
  margin-top: 1em;
  padding-top: 1em;
}
.c-detail-links {
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-flow: row wrap; 
  list-style-type: none;
  gap: 5px;
  /* on safari empty tags collapse, on chrome they take up space.
  this helps keep things consistent  */
  margin: 1em 0;
  padding-inline-start: 0px;

  /* copied from main.css eventlink */
  li {
      border-right: 1px solid var(--page-text);
      padding-right: 5px;
      &:last-child {
        border-right: none;
      }
    }
}

</style>