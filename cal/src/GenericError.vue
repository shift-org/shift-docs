<!-- 
  Display a generic error.
 -->
<script>
export default {
  props: {
    error: [Object, String]
  },
  computed: {
    errorMsg() {
      // force conversion to a string.
      return String(this.error);
    }
  },
}
</script>
<template> 
  <div class="c-error">{{errorMsg}}</div>
</template>
<style>
.c-error {
  font-size: 32px;
  background-color: firebrick;
  color: white;
  margin: 5em auto;
  text-align: center;
}
</style>