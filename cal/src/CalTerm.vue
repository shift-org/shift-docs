<script>
/**
 * Term and definition in a <dl> definition list.
 *    <Term label="name">content</Term>
 * becomes:
 *    <dt>name</dt><dd>content</dd>
 */
export default {
  props: {
    type: String, // suffix for the css class
    label: String, // the name of the term
  },
  methods: {
    cls(which) {
      return {
        [`c-term__${which}`]: true,
        [`c-term__${which}--${this.type}`]: !!this.type,
      };
    }
  }
};
</script>

<template>
  <dt :class="cls('term')">{{ label }}</dt>
  <dd :class="cls('value')"><slot /></dd>
</template>

<style> 
.c-toolbar__backlink {
  position: absolute;
  left: 1em;
  font-size: small;
}

/* cheating a bit to have these here... */
.c-term__value--loc::before {
  content: "📍";
  padding-right: 0.5em;
}
.c-term__value--organizer::before {
  content: "👤";
  padding-right: 0.5em;
}
.c-term__value--time::before {
  content: "⏰";
  padding-right: 0.5em;
}
.c-term__value--news::before {
  content: "💬"; /*🗨📣*/
  padding-right: 0.5em;
}
</style>