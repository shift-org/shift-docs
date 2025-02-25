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
    cancelled: Boolean
  },
  methods: {
    cls(which) {
      return {
        [`c-event__${which}`]: true,
        [`c-event__${which}--${this.type}`]: !!this.type,
        [`c-event__${which}--cancelled`]: this.cancelled,
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
.c-event__value--cancelled {
  text-decoration: line-through;
}
</style>