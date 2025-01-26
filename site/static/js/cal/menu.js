
export default {
  template: `
<ul>
<li v-for="menu in menu">
  <button @click="toggle(menu.id)">{{ menu.name }}</button>
  <ul v-if="expanded === menu.id">
    <li v-for="kid in menu.kids">
      <a :href="kid.url">{{kid.name}}</a>
    </li>
  </ul>
</li>
</ul>
`,  
  props: {
    "menu": Object,
  },
  data() {
    const q = this.$route.query;
    return {
      expanded: q.menu || false
    }
  },
  methods: {
    toggle(name) {
      const q = { ...this.$route.query };
      if (name === this.expanded) {
        this.expanded = false;
        q.menu = undefined;
      } else {
        this.expanded = name;
        q.menu = name;
      }
      this.$router.replace({query: q});
    }
  }
}
