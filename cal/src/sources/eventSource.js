/**
 * a source which fetches cal daily entries
 */
import dataPool from '../support/dataPool.js'
import dayjs from 'dayjs'

export default {
  name: "eventSource",
  async getRange(start, end) {
    // eventData includes { pagination: {}, events: [] }
    const eventData = await dataPool.getRange(start, end);
    return eventData.events.map(evt => Object.assign(evt, {
      uid: `caldaily-${evt.id}`,
      // moment --> added by the event munge already
      type: 'caldaily',
    }));
  } 
}

// example entry:
// {
//     "id": "16",
//     "title": "That's What Friends Are For",
//     "venue": "Sympathetically channel catfish",
//     "address": "7463 Friesen Branch",
//     "organizer": "Catalina Yost",
//     "details": "We need to compress the bluetooth HDD driver!",
//     "time": "13:0:00",
//     "hideemail": false,
//     "hidephone": false,
//     "hidecontact": true,
//     "length": null,
//     "timedetails": "Bardus civis stipes cura approbo sordeo utpote strues curiositas substantia. Caecus tergeo nesciunt sursum una. Acsi abutor via magnam.",
//     "locdetails": "Face to face transitional complexity",
//     "loopride": false,
//     "locend": null,
//     "eventduration": null,
//     "weburl": "https://rude-pea.net/",
//     "webname": null,
//     "image": "/eventimages/bike.jpg",
//     "audience": "A",
//     "tinytitle": "That's What Friends Are For",
//     "printdescr": "We need to compress the bluetooth HDD driver!",
//     "datestype": "O",
//     "area": "P",
//     "featured": false,
//     "printemail": true,
//     "printphone": true,
//     "printweburl": true,
//     "printcontact": true,
//     "published": true,
//     "safetyplan": true,
//     "email": "Catalina.Yost@example.com",
//     "phone": "474-962-4705",
//     "contact": null,
//     "date": "2025-05-06",
//     "caldaily_id": "28",
//     "shareable": "http://localhost:3080/calendar/event-28",
//     "cancelled": true,
//     "newsflash": "far cancelled",
//     "status": "C",
//     "endtime": null,
//     "moment": "2025-05-06T20:00:00.000Z"
// }