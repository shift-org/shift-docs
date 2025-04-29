<!-- display a page describing the calendar beta -->
<script>
export default {
  emits: [ 'pageLoaded' ],
  mounted() {
    // have to tell CalMain that we finished loading okay
    this.$emit("pageLoaded", false); // pass false meaning no special data
  },
}
</script>
<template> 
  <article class="c-beta">
    <b>Welcome to the new Shift Calendar!</b>
    <p>We're trying out a new version of the Shift Calendar optimized for phones. It shows one week at a time, letting you navigate week to week. You can search rides, and even save your favorite rides.</p>
    <p>We consider it a beta -- where "beta" is a classy software term for "might have bugs". 
      Try it out, and <a href="mailto:bikecal@shift2bikes.org">let us know</a> what you think: the good, the bad, and the "hey, it sort of works!"</p>
    <a class="c-beta__button" href="/events">Yes! Try it out!</a>
    <a class="c-beta__button" href="/calendar">No, get me out of here!</a>
   </article>
</template>
<style>
.c-beta {
  b {
    font-size: larger;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: large;
  width: 90%;
  margin: 2em auto;
  border: var(--orangey-border);
  color: var(--feature-text);
  background: var(--feature-bg);
  text-align: center;
  padding: 2em 2em;
}
  
</style>