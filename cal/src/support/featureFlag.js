/**
 * opt-in flags for features that are still being tested.
 *
 * visiting any page with ?name ( or ?name=1 ) turns the flag on
 * for the rest of the browser tab's session; ?name=0 turns it off again.
 * ( the hugo pages share the same flags; see partials/cal/view-options.html )
 *
 * note: this uses sessionStorage rather than localStorage
 * because favorites.js treats every localStorage key as a favorite.
 */
const prefix = "shift-flag-";

// returns true if the named flag is on.
// query is the current url's query, ex. vue's $route.query
export default function featureFlag(name, query) {
  const key = prefix + name;
  try {
    if (name in query) {
      const value = query[name];
      if (value === "0" || value === "false") {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, "1");
      }
    }
    return !!sessionStorage.getItem(key);
  } catch {
    // storage can be unavailable ( ex. some private browsing modes )
    const value = query[name];
    return (name in query) && value !== "0" && value !== "false";
  }
}
