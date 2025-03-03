/**
 *  support functions for CalList.vue
 */
import dayjs from 'dayjs'
import dataPool from './dataPool.js'
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
    shortcuts: buildShortcuts()
  }; 
}

// ---------------------------------------------------------------------
// TODO: allow 'prev' / 'next' to be disabled based on offset/count
function buildShortcuts() {
  return [{
    id: "prev",
    label: "Earlier",
    disabled: true,
    nav(router) {
      // shiftRange(router, start, -1);
    }
  },{
    id: "next",
    label: "Later",
    disabled: true,
    nav(router) {
      // shiftRange(router, start, 1);
    }
  },{
    id: "addevent",
    label: "Add",
    url:"/addevent/"
  },{
    id: "info",
    label: "Info",
    url: "/pages/mission_statement/"
  },{
    id: "donate",
    label: "Donate",
    url: "/pages/donate"
  },{
    id: "favorite",
    label: "Favorites"
    // TODO: router navigate
  }]
}