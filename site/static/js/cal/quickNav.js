// the shortcut contains search, jump to date, and maybe list/grid toggle
// or a jump to old view.
// note: <dialog> is cool -- but it overlays the contents rather than reflows.
import siteConfig from './siteConfig.js'
const daysToFetch = siteConfig.daysToFetch.default;

export default {
  template: `
<div class="c-shortcuts">
  <button class="c-shortcut" v-for="cut in shortcuts" @click="cut.exec">{{cut.icon}}</button>
</div>`,
  props: {
    // cal should contain start, end, [data]
    cal: {
      type: Object,
      required: true,
    }
  },
  data() {
    //const self = this; // inside callbacks we need access to our component
    return {
      shortcuts: [{
        id: "left",
        icon: "⇦",
        label: "Previous Events",
        exec: () => this.shiftRange(-daysToFetch)
      },{
        id: "right",
        icon: "⇨",
        label: "Future Events",
        exec: () => this.shiftRange(daysToFetch)
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
    // shift the current range ahead or behind the passed number of days.
    shiftRange(days) {
      const q = { ...this.$route.query };
      const start = this.cal.start.add(days, 'day');
      q.startdate = start.format("YYYY-MM-DD");
      // if the query doesn't have "enddate" -- dont add it.
      if (q.enddate) {
        const end = this.cal.end.add(days, 'day');
        q.enddate = end.format("YYYY-MM-DD");
      }
      this.$router.replace({query: q});
    }
  }
}