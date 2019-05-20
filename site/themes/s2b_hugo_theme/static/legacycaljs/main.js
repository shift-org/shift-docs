$(document).ready(function() {

    var container = $('#mustache-html');

    function getEventHTML(options, callback) {
        var url = '/api/events.php?';
        if ('id' in options) {
            url += 'id=' + options['id'];
        }
        if ('startdate' in options && 'enddate' in options) {
            url += 'startdate=' + moment(options['startdate']).format("YYYY-MM-DD") + '&enddate=' + moment(options['enddate']).format("YYYY-MM-DD");
        }

        $.get( url, function( data ) {
            var groupedByDate = [];
            var mustacheData = { dates: [] };
            $.each(data.events, function( index, value ) {

                var date = container.formatDate(value.date);
                if (groupedByDate[date] === undefined) {
                    groupedByDate[date] = {
                        yyyymmdd: value.date,
                        date: date,
                        events: []
                    };
                    mustacheData.dates.push(groupedByDate[date]);
                }

                value.displayStartTime = container.formatTime(value.time);
                value.displayDate = container.formatDate(groupedByDate[date]['yyyymmdd'], abbreviated=true);
                if (value.endtime) {
                  value.displayEndTime = container.formatTime(value.endtime);
                }

                value.audienceLabel = container.getAudienceLabel(value.audience);
                value.mapLink = container.getMapLink(value.address);

                if ( 'id' in options || options['show_details'] == true ) {
                    value.expanded = true;
                }
                value.webLink = container.getWebLink(value.weburl);
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
             container.append(eventHTML);
             if ( !('pp' in options) ) {
               // PP has set start and end dates,
               // so don't display "load more" button if PP
               container.append($('#load-more-template').html());
             }
             checkAnchors();
             $(document).off('click', '#load-more')
                  .on('click', '#load-more', function(e) {
                      firstDayOfRange = daysAfter(lastDayOfRange, nextDay);
                      lastDayOfRange = daysAfter(firstDayOfRange, dayRange);
                      getEventHTML({
                          startdate: firstDayOfRange,
                          enddate: lastDayOfRange
                      }, function(eventHTML) {
                          $('#load-more').before(eventHTML);
                          checkAnchors();
                      });
                      return false;
                 });
        });
    }

    function viewEvent(id) {
        container.empty()
            .append($('#show-all-template').html())
            .append($('#scrollToTop').html());

        getEventHTML({id:id}, function (eventHTML) {
            container.append(eventHTML);
            checkAnchors();
        });
    }

    function dateJump(ev) {
        var e = ev.target;
        if (e.hasAttribute('data-date')) {
            var $e = $(e);
            var yyyymmdd = $e.attr('data-date');
            var $jumpTo = $("div[data-date='" + yyyymmdd + "']");
            if($jumpTo.children().length >= 0) {

                $('html, body').animate({
                    scrollTop: $jumpTo.offset().top
                }, 500);
            }
        }
    }

    function viewAddEventForm(id, secret) {
        container.getAddEventForm( id, secret, function(eventHTML) {
            container.empty().append(eventHTML);
            checkAnchors();
            if (id) {
                $(document).off('click', '#confirm-delete')
                    .on('click', '#confirm-delete', function() {
                        deleteEvent(id, secret);
                    });
            }
        });
    }

    $(document).on('click', '#confirm-cancel, #success-ok', function() {
        visitRoute('viewEvents');
    });

    $(document).on('click', '#date-picker-pedalpalooza', function(ev) {
        dateJump(ev);
    });

    $(document).on('touchstart', '#date-picker-pedalpalooza', function(ev) {
        dateJump(ev);
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

    var routes = [];
    function addRoute(test, action) {
        routes.push({ test: test, action: action });
    }
    function checkRoute(frag) {
        for (var i=0; i<routes.length; i++) {
            var route = routes[i];
            if (route.test.test(frag) && route.action(frag) !== false) {
                return true;
            }
        }
    }
    function testRoute(frag) {
        for (var i=0; i<routes.length; i++) {
            if (routes[i].test.test(frag)) {
                return true;
            }
        }
    }
    function visitRoute(frag) {
        if (checkRoute(frag)) {
            history.pushState({}, frag, frag);
        }
    }

    var checkTimeout = null;
    function checkAnchors() {
        if (checkTimeout !== null) {
            clearTimeout(checkTimeout);
        }
        checkTimeout = setTimeout(checkAnchorsDebounced, 500);
    }
    function checkAnchorsDebounced() {
        var aList = document.querySelectorAll('a');
        for (var i=0; i<aList.length; i++) {
            var a = aList[i];
            if (a.hasAttribute('route')) {
                continue;
            }
            var frag = a.getAttribute('href');
            if (frag.indexOf('//') !== -1) {
                // don't mess with external links.
                return;
            }
            if (testRoute(frag)) {
                a.setAttribute('route', 'true');
                a.addEventListener('click', function(ev) {
                    ev.preventDefault();
                    visitRoute(ev.currentTarget.getAttribute('href'));
                    return false;
                });
            }
        }
    }

    window.viewAddEventForm = viewAddEventForm;
    window.viewEvents = viewEvents;
    window.viewEvent = viewEvent;
});
