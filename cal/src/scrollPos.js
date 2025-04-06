// there are two scrolling issues:
// 1. browsers preserve scroll position when going to a sub-page:
//  for example, the user scrolls down the cal list, and selects an event
//  the content of that event will be at the scroll position of the cal list.
// 2. when going backwards from details to the cal list, 
// we want the previous cal list position 
// ( ex. if the event they clicked on was halfway down the page, 
//   when going back to the list, we want to start them halfway down again. )
// so: we store the old position when leaving the events page
// and on every page attempt to reset the position to zero, or whatever we remembered.
const scrollMap = new Map();

function scrollKey(route) {
  // a way to store which page / params we are on.
  return JSON.stringify([route.name, route.query, route.params]);
}

export default {
  savePos(el, route) {
    const key = scrollKey(route);
    // console.log(`saving ${key} ${el.scrollTop}`);
    scrollMap.set(key, el.scrollTop);
  },
  restorePos(el, route) {
    const key = scrollKey(route);
    const pos = scrollMap.get(key) || 0;
    // console.log(`restoring ${key} ${pos}`);
    setTimeout(() => el.scrollTop = pos);
  }
}