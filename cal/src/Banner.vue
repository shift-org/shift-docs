<script>
/**
 * top image ( or title if there is no image )
 */
export default {
  props: {
    "banner": Object, // { image, target(url), alt, title }
  }
}
</script>

<template>
  <header class="c-top">
  <a class="c-top__link" :href="banner.target">
    <template v-if="banner.image">
      <img :alt="banner.alt" :src="banner.image" class="c-top__image">
    </template>
    <template v-else-if="banner.title">
      <span class="c-top__title">{{ banner.title }}</span>
    </template>
  </a>
  </header>
</template>

<style>
</style>