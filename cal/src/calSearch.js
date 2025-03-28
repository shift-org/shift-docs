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
  //
  const { events } = res;
  const { limit, fullcount } = res.pagination;
  const pageNum = 1 + Math.ceil(offset / limit);
  const multiplePages = offset || (events.length < fullcount);
  return {
    page: {
      title: multiplePages ? 
              `${q} - Page ${pageNum} - searching ${siteConfig.title}` : 
              `${q} - searching ${siteConfig.title}`,
      banner: siteConfig.defaultListBanner,
    },
    data: {
      events, 
      offset,
      searchWidth: limit,
      fullCount: fullcount,
      pageNum,
    },
    shortcuts: buildShortcuts(q, offset, limit, events.length, fullcount)
  }; 
}

// ---------------------------------------------------------------------
// TODO: allow 'prev' / 'next' to be disabled based on offset/count
function buildShortcuts(q, offset, limit, count, total) {
  function disabled() {
    return {
      enabled: false,
    }
  }
  function shift(vm, offset) {
    vm.$router.push({query: { 
      q, offset: offset || undefined, // when zero, hide the offset.
    }});
  }
  return {
    prev: offset > 0 ? (vm) => {
      const next = Math.max(0, offset - limit);
      return { 
        click() {
          shift(vm, next);
        }
      };
    } : disabled,
    next: (offset + count) < total ? (vm) => {
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