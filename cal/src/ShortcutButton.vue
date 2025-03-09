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
    }
  },
  data() {
    // the default data
    // our shortcut function can override these values.
    const data = {
      icon: icons.get(this.name),
      enabled: true,
      click() {},
    }
    const { shortcut } = this;
    const addons = (typeof(shortcut) !== "function") ? {} : shortcut(this);
    return Object.assign(data, addons);
  },
} 
</script>
<template>
  <div class="c-shortcut" :class="{ 
    'c-shortcut--enabled': enabled,
    'c-shortcut--disabled': !enabled 
  }">
    <a v-if="href" :href :rel class="c-shortcut__link"
    ><FontAwesomeIcon class="c-shortcut__icon" 
    :icon fixed-width/></a>
    <button v-else class="c-shortcut__button" 
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

.c-shortcut--enabled  .c-shortcut__link,
.c-shortcut--enabled  .c-shortcut__button {
    cursor: pointer;
  @media (hover: hover) {
    &:hover {
        background: darkgrey; 
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
  background: lightgray;
  text-decoration: none;
  
  &:visited {
    color: darkslategray
  }
  color: darkslategray;
}
 </style>