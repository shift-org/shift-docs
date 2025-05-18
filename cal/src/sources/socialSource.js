/**
 * a source which fetches from mastodon rss 
 */
import siteConfig from '../siteConfig.js'
import dayjs from 'dayjs'

export default {
  name: 'socialSource',
  async getRange(start, end) {
    const records = await fetchSocial(siteConfig.socialapi);
    const filteredRecords = records.filter((val) => {
      return !val.moment.isBefore(start) && !val.moment.isAfter(end);
    });
    return filteredRecords;
  }
}

async function fetchSocial(url) {
  return fetch(url)
  .then((response) => response.text())
  .then((text) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    // console.log(doc.documentElement.nodeName);
    const items = Array.from(doc.getElementsByTagName("item"));
    return items.map(item => transform(item, transformer));
  });
}

// generates a record with the named fields
const transformer = {
  uid(node) {
    return getText(node, 'guid');
  }, 
  type() {
    return 'social';
  },
  moment(node) {
    const pubDate = getText(node, 'pubDate');
    return dayjs(pubDate); // ex. Sat, 03 May 2025 18:34:32 +0000
  },
  // include the link as is
  link: true, 
  // convert munged html to real html, ex: '&lt;p&gt;' into '<p>'
  description(node) {
    const desc = getText(node, 'description');
    // alt: via stackoverflow:
    // const txt = document.createElement("textarea");
    // txt.innerHTML = desc;
    // return txt.value;
    const parser = new DOMParser();
    const doc = parser.parseFromString(desc, "text/html");
    return doc.body.innerHTML;
  },
  image(node){
    // leading namespaces in tags like `<media:content>` are ignored. 
    // https://dom.spec.whatwg.org/#selectors
    const img = node.querySelector("content[medium='image']");
    if (img) {
      const url = img.getAttribute('url');
      const alt = img.querySelector("description[type='plain']");
      return { url,  alt: alt && alt.textContent };
    }
  },
  // TODO: maybe category(s) as fields
  // could be a subset of ones we know;
  // or give the ones we don't text with no icons.
};

// the elements of each field can be 'true' ( copy exactly )
// or a function returning a [key, value] pair ( to handle renaming, etc. )
function transform(node, fields) {
  const pairs = Object.keys(fields).map(key => {
    const xform = fields[key];
    const val = (xform === true) ? getText(node, key) : xform(node);
    return [key, val];
  });
  return Object.fromEntries(pairs);
}

function getText(node, key) {
  const kids = node.getElementsByTagName(key); // recurses all children.
  return (kids && kids.length) ? kids[0].textContent : null
}

// -----------------------------------------------------------------
// example feed:
// -----------------------------------------------------------------
// <?xml version="1.0" encoding="UTF-8"?>
// <rss version="2.0" xmlns:webfeeds="http://webfeeds.org/rss/1.0" xmlns:media="http://search.yahoo.com/mrss/">
//   <channel>
//     <title>Shift</title>
//     <description>Public posts from @shift2bikes@pdx.social</description>
//     <link>https://pdx.social/@shift2bikes</link>
//     <image>
//       <url>https://cdn.masto.host/pdxsocial/accounts/avatars/109/980/420/786/837/598/original/4143256c09b33a41.jpg</url>
//       <title>Shift</title>
//       <link>https://pdx.social/@shift2bikes</link>
//     </image>
//     <lastBuildDate>Sat, 03 May 2025 18:34:32 +0000</lastBuildDate>
//     <webfeeds:icon>https://cdn.masto.host/pdxsocial/accounts/avatars/109/980/420/786/837/598/original/4143256c09b33a41.jpg</webfeeds:icon>
//     <generator>Mastodon v4.3.7</generator>
//     <node>
//       <guid isPermaLink="true">https://pdx.social/@shift2bikes/114445338053750362</guid>
//       <link>https://pdx.social/@shift2bikes/114445338053750362</link>
//       <pubDate>Sat, 03 May 2025 18:34:32 +0000</pubDate>
//       <description>&lt;p&gt;Tweed Ride on Sunday — 15th annual!!&gt;&lt;/p&gt;</description>
//       <media:content url="https://cdn.masto.host/pdxsocial/media_attachments/files/114/445/336/889/061/557/original/6f9fd8504e2f8d17.png" type="image/png" fileSize="465866" medium="image">
//         <media:rating scheme="urn:simple">nonadult</media:rating>
//         <media:description type="plain">Flyer for Portland's 15th annual Tweed Ride: Join us for a splendid ride (and picnic, too!). Sunday, May 4th; meet at 11am, ride at noon. Colonel Summers Park, SE 17th Ave &amp; Taylor St.</media:description>
//       </media:content>
//       <category>tweedride</category>
//       <category>bikefun</category>
//       <category>pdxbikes</category>
//       <category>shift2bikes</category>
//     </node>
//   </channel>
// </rss>