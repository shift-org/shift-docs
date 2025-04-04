<script>
import InputText from './InputText.vue'

export default {
  emits: ["changeRoute"],
  components: { InputText },
  data() {
    return {
     attrs: {
        type: "text",
        placeholder: "Search event titles...",
      },
      model: {
        inputText: this.$route.query.q,
      },
      selectText: !!this.$route.query.q,
      all: this.$route.query.all,
    }
  },
  methods: {
    goSearch() {
      const { inputText } = this.model;
      if (inputText) {
        console.log(`searching for ${inputText}`);
        this.$emit("changeRoute", { name: 'search', query: { 
          q: inputText,
          all: this.all || undefined,
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
    <InputText name="search" label="Search" :attrs :model :selectText/>
    <span class="c-search__past">
      <label for="all">Include past events </label>
      <input type="checkbox" id="all" v-model="all"/>
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
  font-size: 14px;
  align-self: center;
  white-space: pre;
}
.c-search__go {
  height: 2em; /* hrm... otherwise it fills the wohle form. */
}
</style>