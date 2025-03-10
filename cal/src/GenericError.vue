<!-- 
  Display a generic error.
 -->
<script>
import { RouterLink } from 'vue-router'
export default {
  components: { RouterLink },
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
  <div class="c-error">
  <div class="c-error__msg">{{errorMsg}}</div>
  <div class="c-error__home">
    <RouterLink :to="{name:'events'}">Events Home</RouterLink>
  </div>
  </div>
</template>
<style>
.c-error {
  /*display: flex;
  align-items: center;
  flex-direction: column;*/
  margin: 5em auto;
  text-align: center;
}
.c-error__msg {
  margin: 5em auto;
  font-size: 32px;
  background-color: firebrick;
  color: white;
}
</style>