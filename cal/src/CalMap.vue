<!--
 * Displays a single day's rides on a map.
 * Clicking a pin opens a dialog with a summary of the ride(s) starting there.
 * Rides without map coordinates are listed below the map.
 -->
<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// components:
import EventSummary from './EventSummary.vue'
// support:
import { fetchDay, groupRides } from './calMap.js'
import format from './support/format.js'

// the center of portland, for days without any pins.
const defaultCenter = [45.52, -122.67];
const defaultZoom = 12;

export default {
  components: { EventSummary },
  emits: [ 'pageLoaded' ],
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.updateDay(to.query.date);
    });
  },
  // triggered when moving to the next or previous day.
  beforeRouteUpdate(to, from) {
    if (to.query.date !== from.query.date) {
      return this.updateDay(to.query.date);
    }
  },
  data() {
    return {
      day: null,
      pins: [],
      unmapped: [],
      // the pin whose rides are shown in the dialog.
      selected: null,
    };
  },
  computed: {
    longDate() {
      return this.day ? format.longDate(this.day) : "";
    },
  },
  // note: the leaflet objects are kept out of data()
  // because vue's reactive proxies confuse leaflet.
  unmounted() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    updateDay(date) {
      return fetchDay(date).then(({ day, rides, page }) => {
        const { pins, unmapped } = groupRides(rides);
        this.day = day;
        this.pins = pins;
        this.unmapped = unmapped;
        this.selected = null;
        this.$emit("pageLoaded", page);
        // wait for the main view to show the page:
        // leaflet needs to know the size of its container.
        return this.$nextTick(() => this.drawPins());
      }).catch((error) => {
        console.error("CalMap error:", error);
        this.$emit("pageLoaded", null, error);
      });
    },
    // create the map ( if needed ), and replace its pins.
    drawPins() {
      if (!this.map) {
        this.map = L.map(this.$refs.map, { zoomControl: true })
          .setView(defaultCenter, defaultZoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        this.layer = L.layerGroup().addTo(this.map);
      }
      this.map.invalidateSize();
      this.layer.clearLayers();
      this.pins.forEach(pin => {
        const cancelled = pin.rides.every(evt => evt.cancelled);
        const count = pin.rides.length;
        const title = pin.rides.map(evt => evt.title).join("; ");
        L.marker([pin.lat, pin.lng], {
          title,
          alt: title,
          keyboard: true,
          icon: L.divIcon({
            className: 'c-map-pin' + (cancelled ? ' c-map-pin--cancelled' : ''),
            html: count > 1 ? `<span>${count}</span>` : '',
            iconSize: [28, 28],
          }),
        }).on('click', () => this.select(pin))
          .addTo(this.layer);
      });
      if (this.pins.length) {
        const bounds = L.latLngBounds(this.pins.map(pin => [pin.lat, pin.lng]));
        this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      } else {
        this.map.setView(defaultCenter, defaultZoom);
      }
    },
    select(pin) {
      this.selected = pin;
      this.$nextTick(() => this.$refs.dialog.showModal());
    },
    close() {
      this.$refs.dialog.close();
    },
    // the dialog's close event: from the button, escape key, etc.
    closed() {
      this.selected = null;
    },
    // clicking the dialog backdrop closes it.
    backdropClick(e) {
      if (e.target === this.$refs.dialog) {
        this.close();
      }
    },
  }
}
</script>
<template>
  <h3 class="c-divider c-divider--center">{{ longDate }}</h3>
  <div class="c-map" ref="map" role="region" aria-label="Map of the day's rides"></div>
  <p v-if="day && !pins.length && !unmapped.length" class="c-map__empty">No rides scheduled.</p>
  <template v-if="unmapped.length">
    <h3 class="c-divider c-divider--center">Not on the map</h3>
    <EventSummary
      v-for="evt in unmapped" :key="evt.caldaily_id"
      :evt="evt"/>
  </template>
  <dialog ref="dialog" class="c-map-dialog"
      aria-label="Ride details"
      @close="closed"
      @click="backdropClick">
    <div v-if="selected" class="c-map-dialog__content">
      <button class="c-map-dialog__close" @click="close" aria-label="Close">&times;</button>
      <EventSummary
        v-for="evt in selected.rides" :key="evt.caldaily_id"
        :evt="evt"/>
    </div>
  </dialog>
</template>
<style>
.c-map {
  /* contain leaflet's own z-indexes, so the map doesn't draw over the fixed header. */
  position: relative;
  isolation: isolate;
  z-index: 0;
  height: calc(100dvh - 12rem);
  min-height: 300px;
  margin: 0.5em 0;
}
.c-map__empty {
  text-align: center;
}
.c-map-pin {
  box-sizing: border-box;
  border-radius: 50%;
  border: 3px solid var(--page-bg, white);
  background-color: var(--active-bg, #e86a1c);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  color: var(--active-text, white);
  font-weight: bold;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.c-map-pin--cancelled {
  background-color: var(--disabled-text, #888);
}
.c-map-dialog {
  width: min(36rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 4rem);
  padding: 0;
  border: var(--page-border);
  border-radius: 12px;
  background-color: var(--page-bg);
  color: var(--page-text);
  &::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
  }
}
.c-map-dialog__content {
  position: relative;
  padding: 0.5em 0;
}
.c-map-dialog__close {
  position: absolute;
  top: 0.25em;
  right: 0.5em;
  z-index: 1;
  border: none;
  background: none;
  color: var(--page-text);
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}
</style>
