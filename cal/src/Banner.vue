<script>
/**
 * top image ( or title if there is no image )
 */

import Meta from './Meta.vue'
import { RouterLink } from 'vue-router'

export default {
  components: { Meta, RouterLink },
  props: {
    banner: Object, // { image, alt, title }
  }
}
</script>

<template>
  <header class="c-banner" v-if="banner">
  <!-- note: excludes og:image:width,height;  so far as i understand, 
  they exist to allow providers to pick images based on size.
  we aren't providing multiple sizes, so we don't need them.
  ( and i don't think we know the true size anyway ) -->
  <Meta property="og:image" :content="banner.image" />
  <RouterLink class="c-banner__link" :to="{name: 'events'}">
    <template v-if="banner.image">
      <img :alt="banner.alt" :src="banner.image" class="c-banner__image">
    </template>
    <template v-else-if="banner.title">
      <span class="c-banner__title">{{ banner.title }}</span>
    </template>
  </RouterLink>
  </header>
</template>

<style>
.c-banner {
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: nowrap;
 }
.c-banner__title {
  font-size: x-large;
  font-style: bold;
}
.c-banner__image {
  max-height: 200px;
  width: auto;
  object-fit: contain;
  margin: 10px;
}
</style>
