import dayjs from 'dayjs'
import siteConfig from './siteConfig.js'

// assume the user refreshes the page at least once a year.
const now = dayjs().year();

const ppYear = Object.keys(siteConfig.pedalp).pop();
const ppShow = ppYear == now; // double equal to test string vs. int
const ppInfo = siteConfig.pedalp[ppYear];

export default {
  currentYear : ppYear,
  show: ppShow, 
  details: ppInfo,
  // the options are pp-landing, calfestival
  useLanding: ppInfo.type === "pp-landing"
}