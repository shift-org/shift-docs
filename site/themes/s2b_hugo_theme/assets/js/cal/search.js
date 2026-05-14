// uses CONSTANTS and jQuery plugins from config.js and helpers.js

$(document).ready(function() {
    var container = $('#mustache-html');
    var query = new URLSearchParams(location.search).get('q') || '';
    var currentOffset = 0;
    var totalCount = 0;
    var pageLimit = 25;

    // Prepopulate the search field with the current query
    $('#search-events-field').val(query);

    if (!query) {
        container.html('<p>Enter a search term above.</p>');
        return;
    }

    document.title = 'Search: ' + query + ' — ' + SITE_TITLE;

    function processAndRender(events, append) {
        var groupedByDate = [];
        var mustacheData = { dates: [] };

        $.each(events, function(index, value) {
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
            value.webLink = container.getWebLink(value.weburl);
            value.contactLink = container.getContactLink(value.contact);
            value.addToGoogleLink = container.getAddToGoogleLink(value);

            groupedByDate[date].events.push(value);
        });

        for (var date in groupedByDate) {
            groupedByDate[date].events.sort(container.compareTimes);
        }

        var template = $('#view-events-template').html();
        var html = Mustache.render(template, mustacheData);

        if (append) {
            $('#load-more').before(html);
        } else {
            container.html(html);
        }
    }

    function fetchSearch(offset) {
        var url = new URL('/api/search.php', window.location.origin);
        url.searchParams.set('q', query);
        if (offset) {
            url.searchParams.set('o', offset);
        }

        $.ajax({
            type: 'GET',
            url: url.toString(),
            headers: API_HEADERS,
            success: function(data) {
                var pagination = data.pagination || {};
                totalCount = pagination.fullcount || 0;
                currentOffset = (pagination.offset || 0) + (pagination.limit || pageLimit);

                var summary = document.getElementById('search-summary');
                if (summary && offset === 0) {
                    summary.textContent = 'Found ' + totalCount + ' event' + (totalCount === 1 ? '' : 's') + ' matching “' + query + '”';
                }

                if (data.events.length === 0 && offset === 0) {
                    container.html('<p>No events found matching “' + query + '”.</p>');
                    $('#load-more').attr('hidden', '');
                    return;
                }

                processAndRender(data.events, offset > 0);

                if (currentOffset < totalCount) {
                    $('#load-more').removeAttr('hidden');
                } else {
                    $('#load-more').attr('hidden', '');
                }
            },
            error: function(data) {
                var msg = data.responseJSON && data.responseJSON.error && data.responseJSON.error.message;
                if (!msg) {
                    msg = data.status + ' ' + data.statusText;
                }
                var template = $('#request-error').html();
                var rendered = Mustache.render(template, { error: msg });
                container.html(rendered);
            }
        });
    }

    fetchSearch(0);

    $(document).on('click', '#load-more', function() {
        fetchSearch(currentOffset);
        return false;
    });

    $(document).on('click', 'button[data-toggle-target]', function() {
        var target = $(this.dataset.toggleTarget);
        if (target.attr('hidden')) {
            target.removeAttr('hidden');
            this.setAttribute('aria-expanded', 'true');
        } else {
            target.attr('hidden', '');
            this.setAttribute('aria-expanded', 'false');
        }
    });
});
