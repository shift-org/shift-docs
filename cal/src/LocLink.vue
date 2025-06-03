<script>
import ExternalLink from './ExternalLink.vue'
import calHelpers from 'shared/js/calHelpers.js'

export default  {
  components: { ExternalLink },
  props: {
    evt: Object,
    class: String,
  },
  computed: {
    mapLink() {
      return calHelpers.getMapLink(this.evt.address);
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