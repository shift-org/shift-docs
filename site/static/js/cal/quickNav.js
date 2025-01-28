// the shortcut contains search, jump to date, and maybe list/grid toggle
// or a jump to old view.
// note: <dialog> is cool -- but it overlays the contents rather than reflows.
import siteConfig from './siteConfig.js'

export default {
  template: `
<div class="c-shortcuts">
  <button class="c-shortcut" v-for="cut in shortcuts" @click="cut.exec">{{cut.icon}}</button>
</div>`,
props: {
  // a dict with a single member: 'shortcut',
  // set to the id of the shortcut to show.
  // ( this allow the expanded object to be shared
  //   and the id of the shortcut to be poked into it; read elsewhere. )
  expanded: Object,
},
data() {
    const route = this.$route;
    const router = this.$router;
    return {
      shortcuts: [{
        id: "left",
        icon: "⇦",
        label: "Previous Events",
        exec() {
          // startDate - 10
          const q = route.query;
          const start = dayjs(q.startdate); // will be now if missing
          ending.subtract(siteConfig.daysToFetch);


        }
      },{
        id: "right",
        icon: "⇨",
        label: "Future Events",
        exec() {
        }
      },{
        id: "add",
        icon: "+",
        label: "Add",
        exec() {
          location.href = "/addevent/";
        }
      },{
        id: "info",
        icon: "ℹ", //  ⛭ or a shift gear icon?
        label: "Info",
        exec() {
          location.href = "/pages/mission_statement/";
        }
      },{
        id: "donate",
        icon: "$",
        label: "Donate",
        exec() {
          location.href = "/pages/donate/";
        }
      },{
        id: "favorites",
        icon: "☆",
        label: "Favorites",
        exec() {
        }
      },
      ]
    }
  },
  methods: {
    toggle(id) {
      const q = { ...this.$route.query };
      if (id === this.expanded.shortcut) {
        this.expanded.shortcut = false;
        q.expanded = undefined;
      } else {
        this.expanded.shortcut = id;
        q.expanded = id;
      }
      this.$router.replace({query: q});
    }
  }
}