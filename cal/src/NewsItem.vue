<!-- 
-->
<script>
export default {
  props: {
    news: Object,
  },
  // https://vuejs.org/api/options-lifecycle.html
  beforeCreate() {
    const el = this;
    fetch(el.news.url)
    .then((response) => response.text())
    .then((text) => {
        el.newsContent = text;
    });
  },
  data() {
    return {
      newsContent: "",
    }
  }
  // this.$refs.inputItem.focus();
};
</script>
<template>
  <article class="c-news">
  <header><h3 class="c-event-header__title">
    {{news.title}}
  </h3></header>
  <div v-html="newsContent"></div>
  </article>
</template>
<style>
.c-news {
  border: var(--orangey-border);
  border-radius: 20px;
  margin: 10px 20px;
  padding: 0px 1em;
  color: var(--feature-text);
  background-color: var(--feature-bg);
}

</style>