<script>
/**
 * Predefined texts describing a ride
 */
export default {
  props: {
    tags: Array,
  },
  methods: {
    // return a list of classes, ex:
    // c-event__audience c-event_audience-G
    tagClass(tag) {
      const short = tag.short || "unknown";
      return [`c-event__${tag.id}`, `c-event__${tag.id}-${short}`];
    }
  }
};
</script>

<template>
  <ul class="c-event__tags" v-if="tags.length">
    <template v-for="tag in tags" :key="tag.id">
      <li :class="tagClass(tag)">{{tag.text}}</li>
    </template>
  </ul>
</template>

<style>
</style>