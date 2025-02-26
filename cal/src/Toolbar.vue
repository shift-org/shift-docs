<script>
import dayjs from 'dayjs'
import ToolDetails from './ToolDetails.vue'

// the toolbar contains search, jump to date, and maybe list/grid toggle
// or a jump to old view.
// note: <dialog> is cool -- but it overlays the contents rather than reflows.
export default {
components: { ToolDetails },
props: {
  // a dict with a single member: 'tool',
  // set to the name of the tool to show.
  // ( this allow the expanded object to be shared
  //   and the name of the tool to be poked into it; read elsewhere. )
  expanded: Object,    
},
data() {
    const self = this; // pin our component for the tool callbacks
    return {
      // not expanded by default; can set to one of the tools for testing
      // can set to one of the tools for testing, ex. "search"
      tools: [{
        name: "search",
        button: "Search",
        // label: "Enter keywords: ",
        attrs: {
          type: "text",
          placeholder: "Search for titles or descriptions",
        },
        runTool() {
        }
      },{
        name: "jump",
        button: "Jump to date",
        label: "Enter date: ",
        attrs: {
          // browsers automatically provide calendar pickers for 'date' type input.
          type: "date",
          min: "2008-01-01",
          // placeholder?
        },
        runTool(inputText) {
          // if the user doesn't select anything the inputText is blank
          // and the day invalid; take no action when that happens.
          const startDate = dayjs(inputText);
          if (startDate.isValid()) {
            const start = startDate.format("YYYY-MM-DD");
            console.log("jump start date", start);
            // alter the url bar; this will trigger calPage queryChanged()
            // https://router.vuejs.org/guide/essentials/navigation.html
            self.$router.replace({name: 'calendar', query: { start }});
            // close the tool on a timeout otherwise chrome complains 
            // ( about the form having disappeared )
            setTimeout(() => {
              self.expanded.tool = false;
            });
          }
        }
      }]
    }
  },
  methods: {
    toggle(name) {
      const q = { ...this.$route.query };
      if (name === this.expanded.tool) {
        this.expanded.tool = false;
        q.expanded = undefined;
      } else {
        this.expanded.tool = name;
        q.expanded = name;
      }
      this.$router.replace({query: q});
    }
  }
}
</script>

<template>
  <div class="c-toolbar">
  <slot></slot>
    <button v-for="tool in tools" :key="tool.name" 
      @click="toggle(tool.name)">{{tool.button}}</button>
    <button class="c-toolbar__menu" @click="toggle('menu')">&equiv;</button>
  </div>
  <div class="c-button-details">
  <template v-for="tool in tools" :key="tool.name">
    <ToolDetails :tool="tool" v-if="expanded.tool == tool.name"></ToolDetails>
  </template>
  </div>
</template>

<style>
 .c-toolbar {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.c-toolbar__menu {
  width: 50px;
  font-size: x-large;
}

</style>