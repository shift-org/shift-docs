<script>
/*
 * set the meta info of the document.
 * based on this idea: https://stackoverflow.com/a/40388120
 */
export default {
  props: {
    // only one should of name, title, or property should be specified.
    name: String,
    title: String,
    property: String,
    content: String,
  },
  mounted() { this.updateDoc() },
  // if any of the values change:
  watch: {
    name() { this.updateDoc() },
    title() { this.updateDoc() },
    property() { this.updateDoc() },
    content() { this.updateDoc() },
  },
  methods: {
    updateDoc() {
      let hadContent = false;
      if (this.title) {
        document.title = this.title;
      } else if (this.content || hadContent) {
        if (this.name) {
          setMeta('name', this.name, this.content);
        } else if (this.property) {
          setMeta('property', this.property, this.content);
        }
        hadContent = true;
      }
    }
  }
}

// <meta property="og:title" content="Calendar">
// <meta name="description" content="Rides calendar">
function setMeta(key, type, content) {
  let meta = document.querySelector(`meta[${key}="${type}"]`);
  if (!content && meta) {
    meta.remove()
  } else if (content) {
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(key, type);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }
}
</script>
<template></template>