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
    // short identifier for the term
    // ex. news, time, etc.
    id: String,      
    // optional, added to the id to create a true html id
    context: String, 
    // the displayed name
    // ( usually hidden, but there for screen readers )
    label: String, 
    // displayed before the text
    pretext: String,
    // definition displayed
    text: [ String, Boolean ],
    // icon override...
    icon: {
      type: String, 
      // by default uses the id
      default(rawProps) {
        return icons.get(rawProps.id);
      },
    },
  },
  computed: {
    exists() {
      return this.text || this.$slots.default;
    },
    customId() {
      return this.context && `${this.id}-${this.context}`;
    }
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
    <dd :class="cls('value')" :id="customId">
      <FontAwesomeIcon class="c-term__icon" v-if="icon" :icon="icon" fixed-width/>
      <slot>{{pretext}}{{text}}</slot></dd>
  </template>
</template>

<style> 
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
}
.c-term__icon {
  padding-right: 10px;
  color: var(--icon-color);
}
</style>