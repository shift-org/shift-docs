<script>

export default {
  props: {
    id: {
      type: String, // caldaily_id
      required: true,
    },
    featured: Boolean,
    hasNews: Boolean,
    time: String,
  },
  computed: {
    describedBy() {
      let res = [];
      if (this.featured) {
        res.push(`featured-${this.id}`);
      }
      if (this.hasNews) {
        res.push(`news-${this.id}`);
      }
      return res.length ?  res.join(" ") : undefined;
    },
  }
};
</script>
<template>
  <header class="c-header" 
  :class="{'c-header--featured': featured}"
  :aria-describedby="describedBy">
    <h3 class="c-header__marquee" v-if="featured"
      :id="`featured-${id}`">
      Featured Event
    </h3>
    <h3 class="c-header__title">
      <div class="c-header__time" v-if="time">{{time}}</div>
      <div class="c-header__text"><slot /></div>
    </h3>
  </header>
</template>
<style>
.c-header__title {
  display: flex;
  align-items: center;
}
.c-header--featured {
  .c-header__marquee {
    text-align: center;
    font-weight: bold;
    color: #630;
    text-transform: uppercase;
    &::before {
      /*  alt text for the content can be specified after the slash;
      having empty alt text should hide from screen readers */
      content: "★ " / "";
    }
    &::after {
      content: " ★" / "";
    } 
  }
}
.c-header__time {
  box-shadow: 2px 2px 1px 1px black;
  border: solid black thin;
  background: white;
  padding: 0.5em;
  margin: 0.5em;
  white-space: nowrap;
}
</style>