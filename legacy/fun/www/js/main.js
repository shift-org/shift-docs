$(document).ready( function() {

    var container = $('#mustache-html');
    var curPage = null;

    function getEventHTML(options, callback) {
        var url = 'events.php?';
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

                if ('id' in options) {
                    value.expanded = true;
                }
                value.webLink = container.getWebLink(value.weburl);
                value.exportlink = 'ics.php?id=' + value.id;

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
            url: 'delete_event.php',
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
                $('#save-result').addClass('text-danger').text(err.message);
            }
        };
        $.ajax(opts);
    }

    function viewEvents(){
        curPage = "viewEvents";

        function daysAfter(d, days) {
            return new Date ((new Date(d)).setDate(d.getDate() + days));
        }

        var nextDay = 1;
        var dayRange = 10;

        var currentDateTime = new Date();
        var firstDayOfRange = new Date(currentDateTime.setHours(0,0,0,0)); // set time to midnight
        var lastDayOfRange = daysAfter(firstDayOfRange, dayRange);

        container.empty()
             .append($('#scrollToTop').html())
             .append($('#ride-list-heading').html());

        // range is inclusive -- all rides on end date are included, even if they start at 11:59pm
        getEventHTML({
            startdate: firstDayOfRange,
            enddate: lastDayOfRange
        }, function (eventHTML) {
            if (curPage !== "viewEvents") {
                return;
            }
             container.append(eventHTML);
             container.append($('#load-more-template').html());
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
        curPage = "viewEvent" + id;
        container.empty()
            .append($('#show-all-template').html())
            .append($('#scrollToTop').html());

        getEventHTML({id:id}, function (eventHTML) {
            if (curPage !== "viewEvent" + id) {
                return;
            }
            container.append(eventHTML);
            checkAnchors();
        });
    }

    function viewAbout() {
        var content = $('#aboutUs').html();
        container.empty().append(content);
        checkAnchors();
    }

    function viewPedalpalooza() {
        curPage = "viewPedalpalooza"
        var startDate = new Date("June 1, 2018");
        var endDate = new Date("June 30, 2018 23:59:59");
        var pedalpalooza = '/cal/images/pp/pp2017.jpg';
        container.empty()
             .append($('#pedalpalooza-header').html())
             .append($('#jump-to-date').html())
             .append($('#scrollToTop').html())
             .append($('#ride-list-heading').html());
        getEventHTML({
            startdate: startDate,
            enddate: endDate
        }, function (eventHTML) {
            if (curPage !== "viewPedalpalooza") {
                return;
            }
             container.append(eventHTML);
             checkAnchors();
        });
    }

    function viewPedalpaloozaArchive() {
        var content = $('#pedalpaloozaArchive').html();
        container.empty().append(content);
        checkAnchors();
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
        curPage = "viewAddEventForm";
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

    $(document).on('click', '#preview-edit-button', function() {
        $('#event-entry').show();
        $('.date').remove();
        $('#preview-button').show();
        $('#preview-edit-button').hide();
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
    window.onpopstate = function (ev) {
        checkRoute(document.location.pathname);
    };

    addRoute(/pedalpalooza$/, viewPedalpalooza);
    addRoute(/addEvent$/, viewAddEventForm);
    addRoute(/editEvent-[0-9]+-[0-9a-f]+$/, function(frag) {
        var rx = /editEvent-([0-9]+)-([0-9a-f]+)$/g;
        var arr = rx.exec(frag);
        viewAddEventForm(arr[1], arr[2]);
    });
    addRoute(/viewEvents$/, viewEvents);
    addRoute(/aboutUs$/, viewAbout);
    addRoute(/pedalpaloozaArchive$/, viewPedalpaloozaArchive);
    addRoute(/event-([0-9]*)$/, function (frag) {
        var rx = /event-([0-9]*)$/g;
        var arr = rx.exec(frag);
        viewEvent(arr[1]);
    });
    addRoute(/\/$/, viewEvents);
    // Support old edit links
    // TODO: remove this after people stop using them.
    var hash = document.location.hash;
    if (hash.indexOf('#editEvent') === 0) {
        var locationHashParts = hash.split('/');
        viewAddEventForm(locationHashParts[1], locationHashParts[2]);
    } else {
        checkRoute( document.location.pathname );
    }
    checkAnchors();
});
