/**
 *  support functions for CalList.vue
 */
import dayjs from 'dayjs'
import dataPool from './support/dataPool.js'
import siteConfig from './siteConfig.js'

// FIX: handle errors?
export async function fetchSearch(q, offset) {
  const result = await dataPool.getSearch(q, offset);
  return buildPage(q, offset, result);
}

// ---------------------------------------------------------------------
// internal functions
// ---------------------------------------------------------------------
function buildPage(q, offset, res) {
  return {
    page: {
      title: `${q} - searching ${siteConfig.title}`,
      banner: siteConfig.defaultListBanner,
      // desc
    },
    data: {
      q, 
      offset,
      // the number of events is the "width"
      // if offset + width >= total; there's no more results.
      events: res.events, 
      // FIX: server should return this if possible
      // ( unless it can't and then the client can count by offset.
      total: res.total || res.events.length,
    },
    shortcuts: buildShortcuts(q, offset, res.events.length)
  }; 
}

// ---------------------------------------------------------------------
// TODO: allow 'prev' / 'next' to be disabled based on offset/count
function buildShortcuts(q, offset, count) {
  function disabled() {
    return {
      enabled: false,
    }
  }
  function shift(vm, offset) {
    vm.$router.push({query: { 
      q, offset,
    }});
  }
  return {
    prev: offset > 0 ? (vm) => {
      const next = Math.max(0, offset - count);
      return { 
        click() {
          shift(vm, next);
        }
      };
    } : disabled,
    next: count > 0 ? (vm) => {
      const next = offset + count;
      return { 
        click() {
          shift(vm, next);
        }
      };
    } : disabled,
    addevent: "/addevent/",
    info: "/pages/mission_statement/",
    donate: "/pages/donate",
    favorites(vm) {
      return {
        click() {
          vm.$router.push({name: 'favorites'}); 
        },
      };
    } 
  };
}