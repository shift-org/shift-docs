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
    label: String // the name of the term
  },
  computed: {
    termClass() {
      const { type } = this;
      return type && [ "c-event__term",  `c-event__term--${type}` ] 
    },
    valueClass() {
      const { type } = this;
      return type && [ "c-event__value", `c-event__value--${type}` ]
    }
  }
};
</script>

<template>
  <dt :class="termClass">{{ label }}</dt>
  <dd :class="valueClass"><slot /></dd>
</template>

<style>
</style>