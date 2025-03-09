<script>
import ExternalLink from './ExternalLink.vue'

const urlPattern = /^https*:\/\//;


export default  {
  components: { ExternalLink },
  props: {
    evt: Object,
    class: String,
  },
  computed: {
    // ported from helpers.js getMapLink
    mapLink() {
      const { address } = this.evt;
      if (!address || address == 'TBA' || address == 'TBD') {
        // if address is null or not available yet, don't try to map it
        return null;
      } else if (address.match(urlPattern)) {
        // if address is a URL rather than a street address, return it as-is
        return address;
      } else {
        // otherwise, map it with Google Maps
        return 'https://maps.google.com/' +
            '?bounds=45.389771,-122.829208|45.659647,-122.404175&q=' +
            encodeURIComponent(address);
      }
    },
    mapText() {
      const { address, venue } = this.evt;
      function join(a, b) {
        return [a, b].filter(Boolean).join(", ");
      };
      return join(venue, address);
    }
  },
}
</script>

<template>
  <ExternalLink v-if="mapLink" :href="mapLink" class="c-loc__link">{{mapText}}</ExternalLink>
  <span v-else>{{mapText}}</span>
  <div v-if="evt.locdetails" class="c-loc__details">{{ evt.locdetails }}</div>
</template>

<style>
.c-loc__details {
  margin-left: 28px;
}
</style>