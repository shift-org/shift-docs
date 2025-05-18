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
  <header class="c-event-header" 
  :class="{'c-event-header--featured': featured}"
  :aria-describedby="describedBy">
    <h3 class="c-event-header__marquee" v-if="featured"
      :id="`featured-${id}`">
      Featured Event
    </h3>
    <h3 class="c-event-header__title">
      <div class="c-event-header__time" v-if="time">{{time}}</div>
      <div class="c-event-header__text"><slot /></div>
    </h3>
  </header>
</template>
<style>
.c-event-header__title {
  display: flex;
  gap: 10px;
}
.c-event-header--featured {
  .c-event-header__marquee {
    text-align: center;
    font-weight: bold;
    color: var(--feature-text);
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
.c-event-header__time {
  box-shadow: 2px 2px 1px 1px var(--logo-color);
  border: solid thin var(--logo-color);
  background: var(--page-bg);
  padding: 0.5em;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.c-event-header__text {
  align-self: center; /* vertically center text */
}
</style>