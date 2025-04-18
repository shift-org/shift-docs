<!--
each shortcut should be:
  string: a url to link to
  function(vm): returns a component data object ( see below )
-->
<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js';

export default {
  components: { FontAwesomeIcon },  
  props: {
    name: String, 
    shortcut: [ String, Function ]
  },
  data() {
    return this.getState();
  },
  watch: {
    // when the shortcut function changes 
    // recompute our button data.
    // (ex. when buildShortcuts gets called.)
    // by copying the state values to 'this' 
    // the function can use 'vm' to alter its values: 
    // ex. it can change an icon on click.
    shortcut() {
      const state = this.getState();
      Object.assign(this, state);
    }
  },
  computed: {
    rel() {
      // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
      // activate the sharing api?
      // const shareData = {
      //   title: "MDN",
      //   text: "Learn web development on MDN!",
      //   url: "https://developer.mozilla.org",
      // }; 
      return this.name === 'share' ? 'bookmark' : false;
    },
    href() {
      const { shortcut } = this;
      return (typeof(shortcut) === "string") ? shortcut : false;
    },
  },
  methods: {
    getState() {
      const { name, shortcut } = this;
      const defaultState = {
        icon: icons.get(name),
        enabled: true,
        click() {}, // does nothing by default
      }
      // if shortcut is a function, 
      // pass our instance (vm) to the function 
      // so it can alter data when needed.
      const addons = (typeof(shortcut) !== "function") ? {} : shortcut(this);
      return Object.assign(defaultState, addons);
    },
  }
} 
</script>
<template>
  <div class="c-shortcut" :class="{ 
    'c-shortcut--enabled': enabled,
    'c-shortcut--disabled': !enabled 
  }">
    <a v-if="href" :href :rel class="c-shortcut__link"
    :aria-label="name"
    :aria-disabled="enabled ? undefined : false"
    role="button"
    ><FontAwesomeIcon class="c-shortcut__icon" 
    :icon fixed-width/></a>
    <button v-else class="c-shortcut__button" 
      :aria-label="name"
      :aria-disabled="enabled ? undefined : false"
      @click="click()"
    ><FontAwesomeIcon class="c-shortcut__icon" 
    :icon fixed-width/></button>
  </div>
</template> 
 <style> 
.c-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.c-shortcut--disabled {
  opacity: 0.5;
}

.c-shortcut--enabled .c-shortcut__link,
.c-shortcut--enabled .c-shortcut__button {
  cursor: pointer;
  @media (hover: hover) {
    &:hover {
        background: darkgrey; 
        color: var(--divider-color);
      }
  }  
  &:active {
    color: white;
  }
}
.c-shortcut__link, .c-shortcut__button {
  font-size: x-large;
  /* make a circle */
  border-radius: 25px;
  border-width: 1px;
  border: none;
  width: 50px;
  height:50px;
  line-height: 50px;
  text-align: center;
  padding: 0; /*  https://stackoverflow.com/questions/44941161/safari-on-ios-cant-render-button-text-center-aligned*/
  background-color: var(--page-bg);;
  text-decoration: none;
  &:visited {
    color: var(--page-text);
  }
  color: var(--page-text);
}
 </style>