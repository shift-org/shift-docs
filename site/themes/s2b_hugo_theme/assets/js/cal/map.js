// displays a single day's rides on a map.
// clicking a pin opens a dialog with the ride(s) starting there;
// rides without map coordinates are listed below the map.
//
// uses CONSTANTS from config.js, leaflet, and renderEventsHTML() from main.js
// the day comes from the url: /calmap/?date=YYYY-MM-DD ( defaults to today )

// the center of portland, for days without any pins.
const MAP_DEFAULT_CENTER = [45.52, -122.67];
const MAP_DEFAULT_ZOOM = 12;

// split rides into map pins and rides without coordinates.
// rides starting at the same spot share a pin.
// returns { pins: [ { lat, lng, rides: [] } ], unmapped: [] }
function groupRides(rides) {
  const pins = new Map();
  const unmapped = [];
  rides.forEach(function(evt) {
    const lat = evt.latitude, lng = evt.longitude;
    if (lat == null || lng == null) {
      unmapped.push(evt);
    } else {
      const key = lat + ',' + lng;
      let pin = pins.get(key);
      if (!pin) {
        pin = { lat: lat, lng: lng, rides: [] };
        pins.set(key, pin);
      }
      pin.rides.push(evt);
    }
  });
  return { pins: Array.from(pins.values()), unmapped: unmapped };
}

// returns the /calmap/ url for the passed dayjs day.
function mapDayUrl(day) {
  return '/calmap/?date=' + day.format('YYYY-MM-DD');
}

function viewMap() {
  const query = new URLSearchParams(location.search);
  // if date is missing, dayjs returns now()
  let day = dayjs(query.get('date') || undefined).startOf('day');
  if (!day.isValid()) {
    day = dayjs().startOf('day');
  }

  document.title = 'Map - ' + day.format('YYYY-MM-DD') + ' - Calendar - ' + SITE_TITLE;
  $('#map-title').text(day.format('dddd, MMMM D, YYYY'));
  $('#map-date-field').val(day.format('YYYY-MM-DD'));
  $('#map-prev').attr('href', mapDayUrl(day.subtract(1, 'day')));
  $('#map-next').attr('href', mapDayUrl(day.add(1, 'day')));

  const map = L.map('ride-map').setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const dialog = document.getElementById('map-dialog');
  const dialogContent = $(dialog).find('.map-dialog-content');
  $(dialog).on('click', function(e) {
    // clicking the backdrop or the close button closes the dialog.
    if (e.target === dialog || $(e.target).closest('.map-dialog-close').length) {
      dialog.close();
    }
  });
  function showPin(pin) {
    dialogContent.html(renderEventsHTML(pin.rides));
    dialog.showModal();
    lazyLoadEventImages();
  }

  const url = new URL(API_EVENTS_URL);
  url.searchParams.set('startdate', day.format('YYYY-MM-DD'));
  url.searchParams.set('enddate', day.format('YYYY-MM-DD'));
  $.ajax({
    type: 'GET',
    url: url.toString(),
    headers: API_HEADERS,
    success: function(data) {
      const groups = groupRides(data.events);
      groups.pins.forEach(function(pin) {
        const cancelled = pin.rides.every(function(evt) { return evt.cancelled; });
        const count = pin.rides.length;
        const title = pin.rides.map(function(evt) { return evt.title; }).join('; ');
        L.marker([pin.lat, pin.lng], {
          title: title,
          alt: title,
          keyboard: true,
          icon: L.divIcon({
            className: 'map-pin' + (cancelled ? ' map-pin-cancelled' : ''),
            html: count > 1 ? '<span>' + count + '</span>' : '',
            iconSize: [28, 28],
          }),
        }).on('click', function() { showPin(pin); })
          .addTo(map);
      });
      if (groups.pins.length) {
        const bounds = L.latLngBounds(groups.pins.map(function(pin) { return [pin.lat, pin.lng]; }));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
      if (groups.unmapped.length) {
        $('#mustache-html').html(renderEventsHTML(groups.unmapped));
        $('#map-unmapped').removeAttr('hidden');
        lazyLoadEventImages();
      }
      if (!data.events.length) {
        $('#map-empty').removeAttr('hidden');
      }
    },
    error: function(data) {
      let msg = data.responseJSON?.error?.message;
      if (!msg) {
        msg = data.status + ' ' + data.statusText;
      }
      const template = $('#request-error').html();
      $('#mustache-html').html(Mustache.render(template, { error: msg }));
      $('#map-unmapped').removeAttr('hidden');
    }
  });
}
