$(document).ready(function() {

    var container = $('#mustache-html');

    function getEventHTML(options, callback) {
        var url = '/api/events.php?';
        if ('id' in options) {
            url += 'id=' + options['id'];
        }
        if ('startdate' in options && 'enddate' in options) {
            url += 'startdate=' + dayjs(options['startdate']).format("YYYY-MM-DD") + '&enddate=' + dayjs(options['enddate']).format("YYYY-MM-DD");
        }

        $.get( url, function( data ) {
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

                if ( 'show_details' in options && options['show_details'] == true ) {
                    value.expanded = true;
                }
                value.webLink = container.getWebLink(value.weburl);
                value.contactLink = container.getContactLink(value.contact);

                value.shareLink = '/calendar/event-' + value.caldaily_id;
                value.exportlink = '/api/ics.php?id=' + value.id;

                // value.showEditButton = true; // TODO: permissions
                groupedByDate[date].events.push(value);
            });

            for ( var date in groupedByDate )  {
                groupedByDate[date].events.sort(container.compareTimes);
            }
            var template = $('#view-events-template').html();
            var info = Mustache.render(template, mustacheData);
            if ('id' in options) {
                // only set on individual ride pages
                var event = mustacheData.dates[0].events[0];
                $('meta[property="og:title"]')[0].setAttribute("content", event.title);
                if (event.printdescr) {
                    $('meta[property="og:description"]')[0].setAttribute("content", event.printdescr);
                } else {
                    var desc = event.details.substring(0,250);
                    $('meta[property="og:description"]')[0].setAttribute("content", desc);
                }
                document.title = event.title + " - Calendar - Shift";
            }
            callback(info);
        });
    }

    function deleteEvent(id, secret) {
        var data = new FormData();
        data.append('json', JSON.stringify({
            id: id,
            secret: secret
        }));
        var opts = {
            type: 'POST',
            url: '/api/delete_event.php',
            contentType: false,
            processData: false,
            cache: false,
            data: data,
            success: function(returnVal) {
                var msg = 'Your event has been deleted';
                $('#success-message').text(msg);
                $('#success-modal').modal('show');
                $('#success-ok').on('click',function() {
                    window.location.href = '/calendar/';
                });
            },
            error: function(returnVal) {
                var err = returnVal.responseJSON
                    ? returnVal.responseJSON.error
                    : { message: 'Server error deleting event!' };
                $('.save-result').addClass('text-danger').text(err.message);
            }
        };
        $.ajax(opts);
    }

    function viewEvents(options){

        function daysAfter(d, days) {
            return new Date ((new Date(d)).setDate(d.getDate() + days));
        }

        var nextDay = 1;
        var dayRange = 10;

        var currentDateTime = new Date();
        var timezoneOffset = (currentDateTime.getTimezoneOffset() / 60);

        var firstDayOfRange = new Date(currentDateTime.setHours(0,0,0,0)); // set time to midnight

        if ('startdate' in options) {
          startDate = new Date(options['startdate']).setUTCHours(timezoneOffset,0,0,0);
          firstDayOfRange = new Date(startDate);
        }

        var lastDayOfRange = daysAfter(firstDayOfRange, dayRange);

        if ('enddate' in options) {
          endDate = new Date(options['enddate']).setUTCHours(timezoneOffset,0,0,0);
          lastDayOfRange = new Date(endDate);
        }

        var isExpanded = false;
        if ('show_details' in options) {
          isExpanded = true;
        }

        container.empty()
             .append($('#scrollToTop').html())

        // range is inclusive -- all rides on end date are included, even if they start at 11:59pm
        getEventHTML({
            startdate: firstDayOfRange,
            enddate: lastDayOfRange,
            show_details: isExpanded
        }, function (eventHTML) {
             // don't load list/grid toggle on PP page (always displays grid)
             if ( !('pp' in options) ) {
               container.append($('#view-as-options').html());
               container.append($('#event-list-options-template').html());
             }
             container.append(eventHTML);
             if ( !('pp' in options) ) {
               // PP has set start and end dates,
               // so don't display "load more" button if PP
               container.append($('#load-more-template').html());
             }
             lazyLoadEventImages();
             $(document).off('click', '#load-more')
                  .on('click', '#load-more', function(e) {
                      firstDayOfRange = daysAfter(lastDayOfRange, nextDay);
                      lastDayOfRange = daysAfter(firstDayOfRange, dayRange);
                      getEventHTML({
                          startdate: firstDayOfRange,
                          enddate: lastDayOfRange,
                          show_details: isExpanded
                      }, function(eventHTML) {
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
            if (id) {
                $(document).off('click', '#confirm-delete')
                    .on('click', '#confirm-delete', function() {
                        container.cleanFormDirt();
                        deleteEvent(id, secret);
                    });
            }
        });
    }

    $(document).on('click', '#confirm-cancel', function() {
      container.cleanFormDirt();
      window.location.href = '/calendar/';
    });

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

    $(document).on('click', '#date-picker-prev-month', function(ev) {
      var currentPosition = $("#date-select").scrollTop();
      $("#date-select").scrollTop(currentPosition - 112);
    });

    $(document).on('click', '#date-picker-next-month', function(ev) {
      var currentPosition = $("#date-select").scrollTop();
      $("#date-select").scrollTop(currentPosition + 112);
    });

    $(document).on('click', '#date-picker-today', function(ev) {
      $("#date-picker .calendar-day.today")[0].scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    });

    $(document).on('click','.navbar-collapse.collapse.in',function(e) {
        if( $(e.target).is('a') ) {
            $(this).collapse('hide');
        }
    });

    $(document).on('click', 'a.expand-details', function(e) {
        e.preventDefault();
        return false;
    });

    $(document).on('click', 'button.edit', function(e) {
        var id = $(e.target).closest('div.event').data('event-id');
        viewAddEventForm(id);
    });

    $(document).on('click', '.preview-edit-button', function() {
        $('#event-entry').show();
        $('.date').remove();
        $('.preview-button').show();
        $('.preview-edit-button').hide();
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
