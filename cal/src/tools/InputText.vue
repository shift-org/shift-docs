<!-- 
  Displays a simple input box and a button for use with the toolbar.
 -->
<script>
// todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms
export default {
  props: {
    name: { 
      type: String,
      required: true 
    },
    label: String,
    attrs: Object,
    model: Object,  // containing "inputText"
  },
  computed: {
    id() {
      // custom tool id: ex. "jump-tool"
      return `${this.name}-tool`
    }
  },
  mounted() {
    // console.log("mounted", this.$refs.inputItem);
    this.$refs.inputItem.focus();
  },
}
</script>
<template>
  <label :for="id">{{label}}</label>
  <input :name="name" 
    :id="id" 
    ref="inputItem"
    v-model="model.inputText"
    v-bind="attrs">
</template>