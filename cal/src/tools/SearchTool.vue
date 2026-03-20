<script>
import InputText from './InputText.vue'

export default {
  emits: ["changeRoute"],
  components: { InputText },
  data() {
    return {
     attrs: {
        type: "text",
        placeholder: "enter keywords",
      },
      model: {
        // the text in the input box should be filled with the query search string.
        inputText: this.$route.query.q,
      },
      // if there is an existing inputText, select it.
      shouldSelect: !!this.$route.query.q,
      // the v-model attribute (below) keeps this in sync with the checkbox state
      searchAll: this.$route.query.all,
    }
  },
  methods: {
    goSearch() {
      const { inputText } = this.model;
      if (inputText) {
        console.log(`searching for ${inputText}`);
        this.$emit("changeRoute", { name: 'search', query: { 
          q: inputText,
          // if the checkbox is 'false' report 'undefined'
          // that makes the url query string be blank instead of "all=false"
          all: this.searchAll || undefined,
        }});
      }
    },
  }
}
</script>
<template>
<form class="c-search" method="dialog">
  <!--  -->
  <div class="c-search__controls">
    <InputText name="search" label="Search" :attrs :model :shouldSelect/>
    <span class="c-search__past">
      <label for="all">Only look at past events</label>
      <input type="checkbox" id="all" v-model="searchAll"/>
    </span>
  </div>
  <!-- 
    note: prevents default to avoid form submission 
    ( chrome issues a warning when the form disappears due to navigation. )
  -->
  <button class="c-search__go" @click.prevent="goSearch()">Go</button>
</form>
</template>
<style>
.c-search {
  display: flex;
  justify-content: center;
  gap:  0.5em;
}
.c-search__controls {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
.c-search__past {
  font-size: 1rem;
  align-self: center;
  white-space: pre;
}
.c-search__go {
  height: 2em; /* hrm... otherwise it fills the wohle form. */
}
</style>