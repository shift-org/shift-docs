$(document).ready(function() {

    var container = $('#mustache-html');

    function getEventHTML(options, callback) {
        var url = '/api/events.php?';
        if (options.id) {
            url += 'id=' + options.id;
        } else if (options.startdate && options.enddate) {
            // these are dayjs objects.
            url += 'startdate=' + options.startdate.format("YYYY-MM-DD") +
                   '&enddate=' + options.enddate.format("YYYY-MM-DD");
        } else {
            throw Error("requires id or range");
        }

        $.ajax({
            url: url,
            headers: { 'Api-Version': API_VERSION },
            type: 'GET',
            success: function(data) {
                var groupedByDate = [];

                var mustacheData = { dates: [] };
                $.each(data.events, function( index, value ) {

                    var date = dayjs(value.date).format('dddd, MMMM D, YYYY');
                    if (groupedByDate[date] === undefined) {
                        groupedByDate[date] = {
                            yyyymmdd: value.date,
                            date: date,
                            events: []
                        };
                        mustacheData.dates.push(groupedByDate[date]);
                    }

                    value.displayStartTime = dayjs(value.time, 'hh:mm:ss').format('h:mm A');
                    value.displayDate = dayjs(value.date).format('ddd, MMM D, YYYY');
                    if (value.endtime) {
                      value.displayEndTime = dayjs(value.endtime, 'hh:mm:ss').format('h:mm A');
                    }

                    value.audienceLabel = container.getAudienceLabel(value.audience);
                    value.areaLabel = container.getAreaLabel(value.area);
                    value.mapLink = container.getMapLink(value.address);

                    if (options.show_details) {
                        value.expanded = true;
                    }
                    value.webLink = container.getWebLink(value.weburl);
                    value.contactLink = container.getContactLink(value.contact);

                    value.shareLink = '/calendar/event-' + value.caldaily_id;
                    value.exportlink = '/api/ics.php?id=' + value.id;

                    groupedByDate[date].events.push(value);
                });

                for ( var date in groupedByDate )  {
                    groupedByDate[date].events.sort(container.compareTimes);
                }
                var template = $('#view-events-template').html();
                var info = Mustache.render(template, mustacheData);
                if (options.id) {
                    // only set on individual ride pages
                    var event = mustacheData.dates[0].events[0];
                    $('meta[property="og:title"]')[0].setAttribute("content", event.title);
                    if (event.printdescr) {
                        $('meta[property="og:description"]')[0].setAttribute("content", event.printdescr);
                    } else {
                        var desc = event.details.substring(0,250);
                        $('meta[property="og:description"]')[0].setAttribute("content", desc);
                    }
                    document.title = event.title + " - Calendar - " + SITE_TITLE;
                }
                callback(info);
            }
        });
    }

    // default range of days to show.
    const dayRange = 10;

    // compute range and details settings from the url options.
    // the returned object gets passed to getEventHTML().
    function getInitialView(options) {
        const today = dayjs().startOf('day');
        const start = dayjs(options.startdate); // if start or end are missing ( from the url )
        const end   = dayjs(options.enddate);   // dayjs returns today.
        const inRange = today >= start && today <= end;
        const from = (inRange && options.pp) ? today : start;
        return {
          // since this year's PP will be in range
          // ( as will the normal calendar events page )
          // 'from' is today; for other PP pages it's options startdate.
          startdate: from,
          // if there was an enddate, use it; otherwise use a fixed number of days.
          enddate: options.enddate ? end : from.add(dayRange, 'day'),
          // pass this on to the events listing.
          show_details: options.show_details,
        };
    }

    // build a list of all upcoming events
    // using the 'view-events-template' template from events.html
    //
    // this is called from events.html when neither /edit nor /event are in the url.
    // options is from parseURL() and includes
    // pp, and startdate, enddate from markdown if on a "pp" page.
    function viewEvents(options){
        const view = getInitialView(options);
        // container is $('#mustache-html'); empty it out.
        container.empty();

        // append the floating "scrollToTop" button
        // ( template is in events.html )
        container.append($('#scrollToTop').html());

        // build the events list:
        // range is inclusive -- all rides on end date are included, even if they start at 11:59pm
        getEventHTML(view, function (eventHTML) {
             // on PP pages only allow grid view
             // otherwise, add the template to toggle.
             if (!options.pp) {
               container.append($('#view-as-options').html());
               container.append($('#event-list-options-template').html());
             }
             container.append(eventHTML);
             if (!options.pp) {
               // PP has set start and end dates,
               // so don't display "load more" button if PP
               container.append($('#load-more-template').html());
             }
             lazyLoadEventImages();
             $(document).off('click', '#load-more')
                  .on('click', '#load-more', function(e) {
                      // the next day to view is one day after the previous last
                      view.startdate = view.enddate.add(1, 'day');
                      view.enddate = view.startdate.add(dayRange, 'day');
                      // add new events to the end of those we've already added.
                      getEventHTML(view, function(eventHTML) {
                          $('#load-more').before(eventHTML);
                          lazyLoadEventImages();
                      });
                      return false;
                 });
        });
    }

    function viewEvent(id) {
        container.empty()
            .append($('#show-all-template').html())
            .append($('#scrollToTop').html());

        getEventHTML({
            id: id,
            show_details: true // always expand details for a single event
        }, function (eventHTML) {
            container.append(eventHTML);
            lazyLoadEventImages();
        });
    }

    function viewAddEventForm(id, secret) {
        container.getAddEventForm( id, secret, function(eventHTML) {
            container.empty().append(eventHTML);
        });
    }

    $(document).on('click', '#show-details', function() {
      var url = new URL(window.location.href);
      var expanded = url.search.includes("show_details");
      var toggle_button = document.getElementById('show-details');

      if (!expanded) {
        url.searchParams.append('show_details', 'true');
        window.location.href = url.href;
      } else {
        url.searchParams.delete('show_details');
        window.location.href = url.href;
      }
    });

    $(document).on('click', '#go-to-date', function() {
      var date = $("#go-to-date-field").val();
      if (date) {
        window.location.href = '/calendar/?startdate=' + date;
      } else {
        window.location.href = '/calendar/';
      }
    });

    $(document).on('click', '#feed-sub', function() {
      var feedUrl = new URL(this.dataset.url);
      window.open(feedUrl);
    });

    $(document).on('click', 'a.expand-details', function(e) {
        e.preventDefault();
        return false;
    });

    $(document).on('click', 'button[data-toggle-target]', function() {
        var target = $( this.dataset.toggleTarget );
        if(target.attr('hidden')) {
            target.removeAttr('hidden');
            this.setAttribute('aria-expanded', 'true')
        } else {
            target.attr('hidden', '');
            this.setAttribute('aria-expanded', 'false')
        }
    });

    //scroll to top functionality
    $(window).scroll(function(){
        if ($(this).scrollTop() > 100) {
            $('.scrollToTop').fadeIn();
        } else {
            $('.scrollToTop').fadeOut();
        }
    });

    $('scrollToTop').click(function(){
        $('html, body').animate({scrollTop: 0}, 800);
        return false;
    });

    // lightly adapted from
    // https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
    function lazyLoadEventImages() {
      var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

      if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              let lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.classList.remove("lazy");
              lazyImageObserver.unobserve(lazyImage);
            }
          });
        });

        lazyImages.forEach(function(lazyImage) {
          lazyImageObserver.observe(lazyImage);
        });
      }
    }

    window.viewAddEventForm = viewAddEventForm;
    window.viewEvents = viewEvents;
    window.viewEvent = viewEvent;
});
