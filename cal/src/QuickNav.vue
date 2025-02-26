<script>
/**
 * QuickNav provides a row of buttons (at the bottom of a page)
 * for navigating through events, with common shortcuts 
 * for adding new events, donations, etc.
 */ 
export default {
  props: {
    // each shortcut in the array should contain an object:
    // shortcut: { id, icon, label, (emit|url|nav) }
    // nav: a function which is handled the router on click
    // emit: an event name to emit
    shortcuts: {
      type: Array,
      required: true,
    }
  },
  methods: {
    id(el) {
      return el.id;
    },
    href(el) {
    },
    // el: one of the shortcuts
    onClick(el) {
      if (el.url) {
        location.href = el.url;
      } else if (el.emit) {
        this.$emit(el.emit);
      } else if (el.nav) { 
        el.nav(this.$router);
      } else {
        // maybe an exec() method on the shortcut?
        // and/or a "route" for navigating to named routes
        console.error(`nothing to do for shortcut ${el.id}`);
      }
    }
  }
}
</script>

<template>
  <div class="c-shortcuts">
  <div class="c-shortcut" v-for="el in shortcuts" :key="el.id">
    <a v-if="el.url"  class="c-shortcut__link"
      :href="el.url" 
      v-bind="el.attrs"
    >{{el.icon}}</a>
    <button v-else class="c-shortcut__button" 
      @click="onClick(el)"
      v-bind="el.attrs"
    >{{el.icon}}</button>
    <div class="c-shortcut__label">{{el.label}}</div>
  </div>
  </div>
</template>

<style>

.c-shortcuts {
  display: flex;
  padding: 10px;
  justify-content: center;
  gap: 20px;
  border-top: solid;
  border-color: lightgray;
}
.c-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  cursor: pointer;
  :hover {
    background: darkgrey; 
  }
  :active {
    color: white;
  }
  :visited {
    color: darkslategray
  }
  color: darkslategray;
}
.c-shortcut__label {
  display: none;
}
</style>