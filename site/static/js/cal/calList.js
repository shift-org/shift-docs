/**
 * display slit of events:
 * equivalent of viewEvents()
 */
import { RouterLink } from 'vue-router'
import siteConfig from './siteConfig.js'
import helpers from './calHelpers.js'

const Term = {
  template: `
<dt :class="termClass">{{ label }}</dt>
<dd :class="valueClass"><slot></slot></dd>
`,
  props: {
    type: String,
    label: String
  },
  computed: {
    termClass() {
      return [ `c-event__term c-event__term--${this.type}` ] 
    },
    valueClass() {
      return [ `c-event__value c-event__value--${this.type}` ]
    }
  }
};

const Event = {
  template: `
<article 
  class="c-event"
  :class="{ 'c-event--cancelled': evt.cancelled, 
            'c-event--featured': evt.featured }"
  :data-event-id="evt.id">
<h3 class="c-event__title"><router-link 
  :to="{name: 'event', params: {caldaily_id: evt.caldaily_id}}"
>{{ evt.title }}</router-link></h3>
<dl>
  <Term type="time" label="Start Time">{{ friendlyTime }}</Term>
  <Term type="news" label="Newsflash" v-if="evt.newsflash">{{ evt.newsflash }}</Term>
  <Term type="author" label="Organizer">{{ evt.organizer }}</Term>
  <Term type="loc" label="Location">
    <a target="_blank" rel="noopener nofollow external" title="Opens in a new window" href="mapLink">{{ join(evt.venue, evt.address) }}</a>
    <div v-if="evt.locdetails">{{ evt.locdetails }}</div>
  </Term>
  <Term type="tags" label="Tags">
    <ul class="c-event__tags">
      <li :class="tag('audience', audienceTag)">{{ audienceLabel }}</li>
      <li :class="tag('area', areaTag)">{{ areaLabel }}</li>
      <li :class="tag('safety', safetyTag)" v-if="evt.safetyplan">{{ safetyLabel }}</li>
    </ul>
  </Term>
</dl>
</article>
`,
  props: {
    evt: Object,
  },
  components: { Term },
  computed: {
    friendlyTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    },
    // maybe this should include hovertext, or something for more details?
    audienceTag() {
      return helpers.getAudienceTag(this.evt.audience);
    },
    audienceLabel() {
      return  helpers.getAudienceLabel(this.evt.audience);
    },
    areaTag() {
      return helpers.getAreaTag(this.evt.area);
    },
    areaLabel() {
      return helpers.getAreaLabel(this.evt.area);
    },
    safetyTag() {
      return this.evt.safetyplan ? "yes" : "no";
    },
    safetyLabel() {
      return this.evt.safetyplan ? "COVID Safety plan" : "No COVID plan";
    },
    mapLink() {
      return helpers.getMapLink(this.evt.address);
    }
  },
  methods: {
    yesNo(v) { return v ? "yes" : "no" },
    // return a list of classes, ex:
    // c-event__audience c-event_audience-G
    tag(name, tag) {
      tag = tag || "unknown";
      return [`c-event__${name}`, `c-event__${name}-${tag}`];
    },
    join(a, b) {
      return [a, b].filter(Boolean).join(", ");
    }
  }
};

export default {
  template: `
<article v-for="(day, index) in days" 
  class="c-day" 
  :data-date="day.date">
  <h2 v-if="divides(day, index, -1)" class="c-day__division c-day__division--start">
    {{fest.title}} Starts
  </h2>
  <h3>{{ longDate(day.date) }}</h3>
  <Event v-for="evt in day.events" :key="evt.caldaily_id" :evt="evt"/>
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
    }
  },
  computed: {
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
    longDate(when) {
      const date = dayjs(when);
      const now = dayjs();
      let format;
      if (date.year() !== now.year()) {
        // Wed, January 22, 2025
        format = 'ddd, MMMM D, YYYY';
      } else if (!date.isSame(now, 'week'))
        // Wed, January 22
        format  = 'ddd, MMMM D';
      else if (!date.isSame(now, 'day')) {
        // Thursday  — Jan 22
        format = 'dddd — MMM D'
      } else {
        format = '[Today] — ddd, MMM D'
      }
      return date.format(format);
    }
  }
}
