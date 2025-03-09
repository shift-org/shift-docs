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