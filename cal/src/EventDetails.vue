<script>
/**
 * display a single instance of an event on a particular day
 * for comparison see: events.html <div class="event-details">
 */
// globals:
import dayjs from 'dayjs'
// components:
import CalTags from './CalTags.vue'
import LocationLink from './LocLink.vue'
import Term from './CalTerm.vue'
// helpers
import { buildPage } from './eventDetails.js'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

function formatTime(t) {
  // note: parsing the time this way requires the customParseFormat
  return dayjs(t, 'hh:mm:ss').format('h:mm A');
}

export default {
  components: { CalTags, LocationLink, Term },
  emits: [ 'pageLoaded' ],
  // before the component is fully created
  // determine our slug and redirect to the proper url
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    // fetch the requested caldaily 
    const { caldaily_id, slug } = to.params;
    console.log(`beforeRouteEnter id: ${caldaily_id} slug: ${slug}`);
    return dataPool.getDaily(caldaily_id).then((evt) => {
      // validate/update the slug:
      const wantSlug = helpers.slugify(evt);
      if (slug !== wantSlug) {
        // next() can redirect to a path or location object.
        console.log(`requesting redirect to slug ${wantSlug}`);
        next({
          name: to.name,
          params: {
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
          if (from.name === 'calendar') {
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
      console.error("event loading error:", error);
      this.$emit("pageLoaded", null, error);
    });
  },
  // triggered when naving left/right through days
  beforeRouteUpdate(to, from) { 
    console.log(`beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
    const { caldaily_id, slug } = to.params;
    return dataPool.getDaily(caldaily_id).then((evt) => {
      const page = buildPage(evt, this.calStart, to.fullPath);
      this.evt = evt; 
      this.$emit("pageLoaded", page);
    }).catch((error) => {
      console.error("event loading error:", error);
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
    terms() {
      const { evt } = this;
      const startTime = formatTime(evt.time);
      const endTime = evt.endtime && formatTime(evt.endtime);
      const terms = [
        { id: "organizer",  label: "Organizer", text: evt.organizer },
        { id: "news",       label: "Newsflash", text: evt.newsflash },
        { id: "starttime",  label: "Start Time", text:  startTime },
        { id: "timedetails",label: "Time Details", text: evt.timedetails },
        { id: "endtime",    label: "End Time", text: endTime },
        { id: "locend",     label: "End Location", text: evt.locend },
        { id: "loopride",   label: "Loop", text: evt.loopride && "Ride is a loop" },
        { id: "desc",       label: "Description", text: evt.details },
      ];
      return terms.filter(a => a.text);
    },
    tags() {
      return helpers.buildEventTags(this.evt)
    },
    startTime() {
      return formatTime(this.evt.time);
    },
    cancelled() {
      return this.evt.cancelled;
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
    //
    
  },
  methods: {
    longDate: helpers.longDate,
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
  <article 
    class="c-single"
    :class="{ 'c-single--cancelled': evt.cancelled, 
              'c-single--featured': evt.featured }"
    :data-event-id="evt.caldaily_id">
    <h3 class="c-single__date"
        :class="{ 'c-single__data--cancelled': evt.cancelled}">
        {{longDate(evt.date)}}</h3>
    <h3 class="c-single__title"
        :class="{ 'c-single__title--cancelled': evt.cancelled}">
        <span class="c-single__time">{{startTime}}</span>
        <span class="c-single__words">{{evt.title}}</span>
    </h3>
    <dl>
      <Term type="tags" label="Tags">
        <CalTags :tags/>
      </Term>
      <Term type="loc" label="Location" :cancelled>
        <LocationLink :evt="evt"></LocationLink>
      </Term>
      <Term v-for="term in terms" :type="term.id" :label="term.label" :cancelled :key="term.id">
        <template v-if="term.id != 'organizer'">
        {{ term.text }}
        </template>
        <template v-else>
          <span class="c-organizer__name c-organizer__name--link" v-if="contactLink(evt)">
            <a  href="contactLink(evt)" target="_blank" rel="noopener nofollow external" 
            title="Opens in a new window">{{evt.organizer}}
            </a>
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
        </template>
      </Term>    
      <Term v-if="evt.weburl" label="More Info" :cancelled>
        <a :href="webLink(evt)" target="_blank" rel="noopener nofollow external" title="Opens in a new window">
          {{evt.webname || evt.weburl}}
        </a>
      </Term>
    </dl>
  </article>
</template>

<style>
.c-single__title, .c-single__date {
  text-decoration: line-through;
}
</style>