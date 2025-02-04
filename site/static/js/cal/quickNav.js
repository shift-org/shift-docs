/**
 * QuickNav provides a row of buttons (at the bottom of a page)
 * for navigating through events, with common shortcuts 
 * for adding new events, donations, etc.
 * 
 * while most buttons are links; 
 * the left/right buttons emit: @navLeft, @navRight 
 */ 
export default {
  template: `
<div class="c-shortcuts">
  <button class="c-shortcut" v-for="el in shortcuts" @click="onClick(el)">{{el.icon}}</button>
</div>`,
  methods: {
    // el: one of the shortcuts
    onClick(el) {
      if (el.url) {
        location.href = el.url;
      } else if (el.emit) {
        this.$emit(el.emit);
      } else {
        // maybe an exec() method on the shortcut?
        // and/or a "route" for navigating to named routes
        console.error(`nothing to do for shortcut ${el.id}`);
      }
    }
  },
  data() {
    const self = this; // inside callbacks we need access to our component
    return {
      shortcuts: [{
        id: "left",
        icon: "⇦",
        label: "Previous Events",
        emit: "navLeft"
      },{
        id: "right",
        icon: "⇨",
        label: "Future Events",
        emit: "navRight"
      },{
        id: "add",
        icon: "+",
        label: "Add",
        url:"/addevent/"
      },{
        id: "info",
        icon: "ℹ", //  ⛭ or a shift gear icon?
        label: "Info",
        url: "/pages/mission_statement/"
      },{
        id: "donate",
        icon: "$",
        label: "Donate",
        url: "/pages/donate"
      },{
        id: "favorites",
        icon: "☆",
        label: "Favorites"
        // TODO: router navigate to 
      }]
    }
  }
}