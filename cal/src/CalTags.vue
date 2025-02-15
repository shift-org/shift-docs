<script>
/**
 * Predefined labels describing a ride
 */
import helpers from './calHelpers.js'

export default {
  props: {
    evt: Object, 
  },
  computed: {
    areaTag() {
      return helpers.getAreaTag(this.evt.area);
    },
    areaLabel() {
      return helpers.getAreaLabel(this.evt.area);
    },
    // maybe this should include hovertext, or something for more details?
    audienceTag() {
      return helpers.getAudienceTag(this.evt.audience);
    },
    audienceLabel() {
      return  helpers.getAudienceLabel(this.evt.audience);
    },
    //
    useSafetyTag() {
      return !!this.evt.safetyplan;
    },
    safetyTag() {
      return this.evt.safetyplan ? "yes" : "no";
    },
    safetyLabel() {
      return this.evt.safetyplan ? "COVID Safety plan" : "No COVID plan";
    },
  },
  methods: {
    // return a list of classes, ex:
    // c-event__audience c-event_audience-G
    tag(name, tag) {
      tag = tag || "unknown";
      return [`c-event__${name}`, `c-event__${name}-${tag}`];
    }
  }
};
</script>

<template>
  <ul class="c-event__tags">
    <li :class="tag('audience', audienceTag)">{{ audienceLabel }}</li>
    <li :class="tag('area', areaTag)">{{ areaLabel }}</li>
    <li :class="tag('safety', safetyTag)" v-if="useSafetyTag">{{ safetyLabel }}</li>
  </ul>
</template>

<style>
</style>