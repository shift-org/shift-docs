/**
 *  support functions for CalList.vue
 */
import dayjs from 'dayjs'
import dataPool from './support/dataPool.js'
import siteConfig from './siteConfig.js'

export async function fetchSearch(q, offset, searchAll) {
  const result = await dataPool.getSearch(q, offset, searchAll);
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
    shortcuts: buildShortcuts(offset, limit, events.length, fullcount)
  }; 
}

// ---------------------------------------------------------------------
function buildShortcuts(offset, limit, count, total) {
  function disabled() {
    return {
      enabled: false,
    }
  }
  // note: vm is actually the next or prev button, not CalSearch.
  function shift(vm, offset) {
    const query = { ...vm.$route.query };
    query.offset = offset || undefined;
    vm.$router.push({query});
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