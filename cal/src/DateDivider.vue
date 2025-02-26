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