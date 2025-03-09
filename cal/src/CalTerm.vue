<script>
/**
 * Term and definition in a <dl> definition list.
 *    <Term label="name">content</Term>
 * becomes:
 *    <dt>name</dt><dd>content</dd>
 */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js'

export default {
  components: { FontAwesomeIcon },
  props: {
    id: String,    // suffix for the css class
    label: String, // the name of the term
    text: [ String, Boolean ],
    icon: {
      type: String, 
      // by default uses the id
      default(rawProps) {
        return icons.get(rawProps.id);
      },
    }
  },
  computed: {
    exists() {
      return this.text || this.$slots.default;
    },
  },
  methods: {
    cls(which) {
      return {
        [`c-term__${which}`]: true,
        [`c-term__${which}--${this.id}`]: !!this.id,
      };
    }
  }
};
</script>

<template>
  <template v-if="exists">
    <dt :class="cls('key')">
      <span class="c-term__label" >{{label}}</span>
    </dt>
    <dd :class="cls('value')">
      <FontAwesomeIcon class="c-term__icon" v-if="icon" :icon="icon" fixed-width/>
      <slot>{{text}}</slot></dd>
  </template>
</template>

<style> 

/* cheating a bit by putting this here */
.c-terms {
  margin-top: 0px;
}

.c-term__key {
  /* why have the term just to hide it? good question simon. */
  display: none;
}
.c-term__value {
 margin: 0px 0.5em;
 padding: 0px; 
}
.c-term__value--tags {
  margin: 0px;
  padding: 0px;
 .c-tags  {
    /* removes ul indentation */
    padding-inline-start: 0px;
  }
}
.c-toolbar__backlink {
  position: absolute;
  left: 1em;
  font-size: small;
}
.c-term__icon {
  padding-right: 10px;
  color: goldenrod;
}
</style>