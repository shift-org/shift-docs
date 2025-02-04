
export default  {
  template: `
  <a target="_blank" rel="noopener nofollow external" title="Opens in a new window" href="mapLink" class="c-map-link">{{ join(evt.venue, evt.address) }}</a>
<div v-if="evt.locdetails">{{ evt.locdetails }}</div>
`,
  props: {
    evt: Object,
    class: String,
  },
  methods: {
    join(a, b) {
      return [a, b].filter(Boolean).join(", ");
    }
  },
};

