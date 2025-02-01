
// todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms
const ToolDetails = {
  // a form's action identifies a server endpoint
  // the method determines the client-server interaction ( GET, POST, etc. )
  // for get, the browser will send controls as name-value query params
  // for post, it will send a request body with that same info.
  // the 'dialog' method is a do-nothing which javascript can intercept.
  template: `
<form method="dialog">
    <label :for="id">{{tool.label}}</label>
    <input :name="tool.name" 
      :id="id" 
      ref="inputItem"
      v-model="inputText"
      v-bind="tool.attrs">
    <button v-if="tool.attrs.type == 'date'" @click="today()">Today</button>
    <button @click="submit()">Go</button>
</form>
`,
  props: {
    tool: Object,
  },
  data() {
    return {
      // when the input changes, v-model changes this value.
      inputText: "",
    }
  },
  computed: {
    id() {
      // custom tool id: ex. "jump-tool"
      return `${this.tool.name}-tool`
    }
  },
  methods: {
    // because its a form, we don't need the 
    // keyhandler on the input button
    //  @keyup.enter="submit"
    submit(src) {
      this.tool.runTool(this.inputText);
    },
    today() {
      this.inputText = dayjs().format("YYYY-MM-DD");
    },
  },
  mounted() {
    // console.log("mounted", this.$refs.inputItem);
    this.$refs.inputItem.focus();
  },
}

// the toolbar contains search, jump to date, and maybe list/grid toggle
// or a jump to old view.
// note: <dialog> is cool -- but it overlays the contents rather than reflows.
export default {
  template: `
<div class="c-toolbar">
  <button v-for="tool in tools" @click="toggle(tool.name)">{{tool.button}}</button>
  <button class="c-toolbar__menu" @click="toggle('menu')">&equiv;</button>
</div>
<div class="c-button-details">
<template v-for="tool in tools">
  <ToolDetails :tool="tool" v-if="expanded.tool == tool.name"></ToolDetails>
</template>
</div>`,
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
          const start = dayjs(inputText);
          if (start.isValid()) {
            const startdate = start.format("YYYY-MM-DD");
            console.log("jump start date", startdate);
            // alter the url bar; this will trigger calPage queryChanged()
            // https://router.vuejs.org/guide/essentials/navigation.html
            self.$router.replace({name: 'calendar', query: { startdate }});
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