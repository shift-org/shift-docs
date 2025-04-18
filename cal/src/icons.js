/**
 * icon import and de-reference table
 */
import { library } from '@fortawesome/fontawesome-svg-core'

import { 
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faArrowTrendDown,
  faArrowUpRightFromSquare, 
  faBars,
  faBullhorn,
  faCaretDown,
  faCaretRight,
  faChildReaching, 
  faCirclePlus,
  faCircleXmark,
  faDollarSign,
  faDownload,
  faHouse,
  faLocationDot,
  faMaskFace, 
  faMountain,
  faPlus,
  faShareNodes,
  faStar as faStarSolid,
  faUser,
} from '@fortawesome/free-solid-svg-icons'

import { 
  faClock,
  faComment,
  faStar as faStarRegular,
  faStarHalfStroke,
} from '@fortawesome/free-regular-svg-icons'

library.add(
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faArrowTrendDown,
  faArrowUpRightFromSquare, 
  faBars,
  faBullhorn,
  faCaretDown,
  faCaretRight,
  faChildReaching, 
  faCirclePlus, 
  faCircleXmark,
  faClock,
  faComment,
  faDollarSign,
  faDownload,
  faHouse,
  faLocationDot,
  faMaskFace, 
  faMountain,
  faPlus,
  faShareNodes,
  faStarHalfStroke,
  faStarRegular,
  faStarSolid, 
  faUser,
);

const icons = {
  addevent: "fa-solid fa-plus",
  adultsOnly: "fa-solid fa-circle-plus",
  caretDown: "fa-solid fa-caret-down",
  caretRight: "fa-solid fa-caret-right",
  cancelled: "fa-solid fa-circle-xmark",
  donate: "fa-solid fa-dollar-sign",
  export:  "fa-classic fa-download",
  externalLink: "fa-solid fa-arrow-up-right-from-square",
  familyFriendly: "fa-solid fa-child-reaching",
  favorites: "fa-regular fa-star-half-stroke",
  favoriteYes: "fa-solid fa-star", // filled
  favoriteNo: "fa-regular fa-star",  // unfilled
  home: "fa-solid fa-house",
  location: "fa-solid fa-location-dot",
  loop: "fa-solid fa-arrows-rotate",
  menu: "fa-solid fa-bars",
  news: "fa-solid fa-bullhorn",
  next: "fa-solid fa-arrow-right",
  organizer: "fa-solid fa-user",
  locend: "fa-solid fa-arrow-trend-down",
  prev: "fa-solid fa-arrow-left",
  safetyPlan: "fa-solid fa-mask-face",
  share: "fa-solid fa-share-nodes",
  time: "fa-regular fa-clock",
  timedetails: "fa-regular fa-comment",
  westside: "fa-solid fa-mountain",
}

export default {
  get(name) {
    return icons[name]; // log if missing?
  }
}