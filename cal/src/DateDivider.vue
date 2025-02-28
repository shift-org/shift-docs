<script>
import dayjs from 'dayjs'

export default {
  props: {
    date: [String,  Object] // raw string or dayjs date
  },
  computed: {
    // the 'date' in words
    longDate() {
      const date = dayjs(this.date);
      const now = dayjs();
      let format;
      if (date.year() !== now.year()) {
        // Wed, January 22, 2025
        format = 'MMMM D, YYYY (ddd)';
      } else if (!date.isSame(now, 'month')) {
        // Wed, January 22
        format  = 'dddd, MMMM Do';
      } else if (!date.isSame(now, 'day')) {
        // Wed, Jan 22
        format  = 'dddd, MMM Do';
      } else {
        format = '[Today] — ddd, MMM Do'
      }
      return date.format(format);
    }
  }
}
</script>
<template>
<h3 class="c-date-divder">
    {{longDate}}
</h3>  
</template>
<style>
  /* based on '.date h2' in main.css */
.c-date-divder {
  background-color: #fd6;
  color: #630;
  border: 1px solid transparent;
  padding: 10px;
  margin: 5px 0;
}
</style>