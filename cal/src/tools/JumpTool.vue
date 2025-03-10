<script>
import dayjs from 'dayjs'
import InputText from './InputText.vue'  

// todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms
export default {
  emits: ["changeRoute"],
  components: { InputText },
  data() {
    return {
      attrs: {
        type: 'date',// browsers automatically provide calendar pickers for 'date' type input.
        min: '2008-01-01',
      },
      model: {
        inputText: "",
      }
    }
  },
  methods: {
    showToday() {
      const today = dayjs().format("YYYY-MM-DD");
      this.model.inputText = today;
    },
    jumpToDate() {
      const { inputText } = this.model;
      // if the user doesn't select anything the inputText is blank
      // and the day invalid; take no action when that happens.
      const startDate = dayjs(inputText);
      if (startDate.isValid()) {
        const start = startDate.format("YYYY-MM-DD");
        console.log("jump start date", start);
        // call toggle to collapse the bar before navigating away
        const today = dayjs().format("YYYY-MM-DD");
        const query = (today === start) ? {}  : { start };
        this.$emit("changeRoute",  {name: 'events', query});
      }
    },
  }
}
</script>
<template>
  <form method="dialog">
  <InputText name="jump" label="Jump" :attrs :model />
  <button @click.prevent="showToday()">Today</button>
  <button @click.prevent="jumpToDate()">Go</button>
  </form>
</template>