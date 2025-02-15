<script>
import dayjs from 'dayjs'

// todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms
export default {
  // a form's action identifies a server endpoint
  // the method determines the client-server interaction ( GET, POST, etc. )
  // for get, the browser will send controls as name-value query params
  // for post, it will send a request body with that same info.
  // the 'dialog' method is a do-nothing which javascript can intercept.
  props: {
    tool: {
      type: Object,
      required: true,
    }
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
</script>

<template>
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
</template>