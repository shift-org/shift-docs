
const ToolDetails = {
  template: `
<div><form method="dialog">
    <label :for="id">{{tool.label}}</label>
    <input :name="tool.name" 
    :id="id" 
    ref="inputItem"
    v-bind="tool.attrs">
    <button @click="submit()">Go</button>
</form></div>
`,
  props: {
    tool: Object,
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
      console.log("--- submit --", src);
      this.tool.runTool();
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
<div class="c-button-bar">
  <button v-for="tool in tools"  @click="toggle(tool.name)">{{tool.button}}</button>
</div>
<div class="c-button-details">
<template v-for="tool in tools">
  <ToolDetails :tool="tool" v-if="expanded == tool.name"></ToolDetails>
</template>
</div>`,
components: { ToolDetails },
data() {
    return {
      // not expanded by default; can set to one of the tools for testing
      // can set to one of the tools for testing, ex. "search"
      expanded: false,
      tools: [{
        name: "search",
        button: "Search",
        label: "Enter keywords: ",
        attrs: {
          type: "text",
        },
        runTool() {
        }
      },{
        name: "jump",
        button: "Jump to date",
        label: "Enter date: ",
        attrs: {
          type: "date",
          min: "2008-01-01",
        },
        runTool() {
        }
      }]
    }
  },
  methods: {
    toggle(name) {
      if (name === this.expanded) {
        this.expanded = false;
      } else {
        this.expanded = name;
      }
    }
  }
}


