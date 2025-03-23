<script>
import InputText from './InputText.vue'

export default {
  emits: ["changeRoute"],
  components: { InputText },
  data() {
    return {
     attrs: {
        type: "text",
        placeholder: "Search for events...",
      },
      model: {
        inputText: "",
      }
    }
  },
  methods: {
    goSearch() {
      const { inputText } = this.model;
      if (inputText) {
        console.log(`searching for ${inputText}`);
        this.$emit("changeRoute", { name: 'search', query: { 
          q: inputText, 
        }});
      }
    },
  }
}
</script>
<template>
<form method="dialog">
  <!--  -->
  <InputText name="search" label="Search" :attrs :model/>
    <!-- 
    note: prevents default to avoid form submission 
    ( chrome issues a warning when the form disappears due to navigation. )
  -->
  <button @click.prevent="goSearch()">Go</button>
</form>
</template>
<style>
#search-tool {
  font-size: 16px;
}
</style>