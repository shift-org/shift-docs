<script>
import dayjs from 'dayjs'
import format from './support/format.js'

export default {
  props: {
    date: [String,  Object] // raw string or dayjs date
  },
  computed: {
    // the 'date' in words
    longDate() {
      return format.longDate(dayjs(this.date));
    }
  }
}
</script>
<template>
<h3 class="c-divder">
    {{longDate}}
</h3>  
</template>
<style>
</style>