/**
 * icon import and de-reference table
 */
import { library } from '@fortawesome/fontawesome-svg-core'

import { 
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faArrowUpRightFromSquare, 
  faBullhorn,
  faChildReaching, 
  faCircleDollarToSlot,
  faCirclePlus,
  faCircleXmark,
  faInfo,
  faLocationDot,
  faMaskFace, 
  faMountain,
  faPersonBiking,
  faShare,
  faUser,
} from '@fortawesome/free-solid-svg-icons'

import { 
  faCalendarPlus,
  faClock,
  faComment,
  faStar, 
} from '@fortawesome/free-regular-svg-icons'

library.add(
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faArrowUpRightFromSquare, 
  faBullhorn,
  faCalendarPlus,
  faChildReaching, 
  faCircleDollarToSlot,
  faCirclePlus, 
  faCircleXmark,
  faClock,
  faComment,
  faInfo,
  faLocationDot,
  faMaskFace, 
  faMountain,
  faPersonBiking,
  faShare,
  faStar, 
  faUser,
);

export default {
  addevent: "fa-solid fa-person-biking",
  adultsOnly: "fa-solid fa-circle-plus",
  cancelled: "fa-solid fa-circle-xmark",
  donate: "fa-solid fa-circle-dollar-to-slot",
  export:  "fa-regular fa-calendar-plus",
  externalLink: "fa-solid fa-arrow-up-right-from-square",
  familyFriendly: "fa-solid fa-child-reaching",
  favorite: "fa-regular fa-star",
  info: "fa-solid fa-info",
  location: "fa-solid fa-location-dot",
  loop: "fa-solid fa-arrows-rotate",
  news: "fa-solid fa-bullhorn",
  next: "fa-solid fa-arrow-right",
  organizer: "fa-solid fa-user",
  prev: "fa-solid fa-arrow-left",
  safetyPlan: "fa-solid fa-mask-face",
  share: "fa-solid fa-share",
  time: "fa-regular fa-clock",
  timedetails: "fa-regular fa-comment",
  westside: "fa-solid fa-mountain",
}