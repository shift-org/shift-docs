/**
 * support functions for CalMap.vue
 */
import dayjs from 'dayjs'
import dataPool from './support/dataPool.js'
import siteConfig from './siteConfig.js'

// promises the page info, and the rides for a single day.
// ( date is a YYYY-MM-DD string; if missing, uses today. )
export async function fetchDay(date) {
  const day = dayjs(date).startOf('day'); // if date is missing, dayjs returns now()
  if (!day.isValid()) {
    throw new Error(`Invalid date: "${date}"`);
  }
  const data = await dataPool.getRange(day, day);
  return {
    day,
    rides: data.events,
    page: buildPage(day),
  };
}

// split rides into map pins and rides without coordinates.
// rides starting at the same spot share a pin.
// returns { pins: [ { lat, lng, rides: [] } ], unmapped: [] }
export function groupRides(rides) {
  const pins = new Map();
  const unmapped = [];
  rides.forEach(evt => {
    const { latitude: lat, longitude: lng } = evt;
    if (lat == null || lng == null) {
      unmapped.push(evt);
    } else {
      const key = `${lat},${lng}`;
      let pin = pins.get(key);
      if (!pin) {
        pin = { key, lat, lng, rides: [] };
        pins.set(key, pin);
      }
      pin.rides.push(evt);
    }
  });
  return { pins: Array.from(pins.values()), unmapped };
}

// ---------------------------------------------------------------------
function buildPage(day) {
  return {
    page: {
      title: `Map - ${day.format("YYYY-MM-DD")} - ${siteConfig.title}`,
      banner: siteConfig.defaultListBanner,
    },
    shortcuts: {
      prev: shiftDay(day, -1),
      next: shiftDay(day, 1),
      addevent: "/addevent/",
      donate: "/pages/donate",
    },
  };
}

// returns a shortcut which moves the map to an earlier or later day.
function shiftDay(day, dir) {
  return function(vm) {
    return {
      click() {
        const query = { ...vm.$route.query };
        query.date = day.add(dir, 'day').format("YYYY-MM-DD");
        vm.$router.push({ query });
      }
    };
  };
}
