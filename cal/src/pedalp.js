import dayjs from 'dayjs'
import siteInfo from 'extras/siteInfo.json'

// assume the user refreshes the page at least once a year.
const now = dayjs().year();

// get the most recent year
const ppYear = Object.keys(siteInfo.pedal).pop();
const ppShow = ppYear == now; // double equal to test string vs. int
const ppInfo = siteInfo.pedal[ppYear];

export default {
  currentYear : ppYear,
  show: ppShow, 
  details: ppInfo,
  // the options are festival-landing, calfestival
  useLanding: ppInfo.type === "festival-landing"
}