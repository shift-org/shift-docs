<!-- 
  Displays a simple input box and a button for use with the toolbar.
 -->
<script>
export default {
  props: {
    name: { 
      type: String,
      required: true 
    },
    label: String,
    attrs: Object,
    model: Object,  // containing "inputText"
    selectText: Boolean
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
    if (this.selectText) {
      this.$refs.inputItem.select();
    }
  },
}
</script>
<template>
  <span class="c-input_text">
    <label :for="id">{{label}}</label> <input :name="name" 
      :id="id" 
      ref="inputItem"
      v-model="model.inputText"
      v-bind="attrs">
  </span>
</template>
<style>
.c-input_text {
  white-space: pre;
}
</style>