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
    // c-tags__audience c-tags_audience-G
    tagClass(tag) {
      const short = tag.short || "unknown";
      return [`c-tag__${tag.id}`, `c-tag__${tag.id}-${short}`];
    }
  }
};
</script>

<template>
  <ul class="c-tags" v-if="tags.length">
    <template v-for="tag in tags" :key="tag.id">
      <li :class="tagClass(tag)">{{tag.text}}</li>
    </template>
  </ul>
</template>

<style>
</style>