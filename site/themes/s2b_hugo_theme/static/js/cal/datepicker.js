(function($) {

    // Global state variables, initialized in setupDatePicker
    var $dateSelect,
        $dateSelected,
        $loadLater,
        $loadEarlier,
        $datePicker,
        monthTemplate,
        earliestMonth,
        latestMonth,
        dateMap,
        today,
        selectedCount = 0;

    // Some constants used for generating html. The JOY of javascript stdlib
    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    var cellClases = ["color-jan", "color-feb", "color-mar", "color-apr", "color-may", "color-jun",
        "color-jul", "color-aug", "color-sep", "color-oct", "color-nov", "color-dec"];

    $.fn.dateStatusesList = function() {
        var selectedDates = $("#date-selected li").toArray();
        var dateStatuses = selectedDates.map( function(date) {
          var datestatus = {};
          datestatus['id'] = date.getAttribute('data-id');
          datestatus['date'] = date.querySelector('span').innerHTML;
          datestatus['status'] = date.querySelector('select').value;
          datestatus['newsflash'] = date.querySelector('.newsflash').value;
          return datestatus;
        });
        return dateStatuses;
    };


    // setupDatePicker sets up the global variables and populates the date picker element
    $.fn.setupDatePicker = function(dateStatuses) {
        // Fill in global variables
        // Set up dateMap
        dateMap = {};
        dateStatuses.forEach(function(dateStatus) {
            dateMap[normalizeDate(dateStatus['date'])] = {
                selected: true,
                dateStatus: dateStatus
            }
            selectedCount++;
        });

        // Scrolling container for the table
        $dateSelect = $('#date-select');
        $dateSelected = $('#date-selected');
        // Placeholder divs that trigger loading when visible
        $loadLater = $('#load-later');
        $loadEarlier = $('#load-earlier');
        // Table that contains months
        $datePicker = $("#date-picker");

        monthTemplate = $('#mustache-select-month').html();

        // Tracks when today is for styling purposes
        today = new Date();
        // These track which month to add to the start/end
        earliestMonth = today;
        latestMonth = today;

        // Fill in the first month
        $datePicker.html(getMonthHTML(earliestMonth));
        // Scroll the table to the top of the first month
        $dateSelect.scrollTop(loadEarlierBottom());

        // Add a click handler for individual days
        $datePicker.click(function(ev) {
            var e = ev.target;
            if (e.hasAttribute('data-date')) {
                var $e = $(e);
                var date = $e.attr('data-date');

                if (date in dateMap) {
                    dateMap[date]['selected'] = !dateMap[date]['selected'];
                    if (dateMap[date]['selected']) {
                        selectedCount++;
                        dateStatuses.push(dateMap[date]['dateStatus']);
                        $('.save-button').prop('disabled', false);
                        $('.preview-button').prop('disabled', false);
                    } else {
                        selectedCount--;
                        var match = dateStatuses.findIndex(function(deselectedDate) {
                            return deselectedDate['date'] == date;
                        });
                        dateStatuses.splice(match, 1);
                        if ( selectedCount === 0 ) {
                            $('.save-button').prop('disabled', true);
                            $('.preview-button').prop('disabled', true);
                        }
                    }
                } else {
                    var newDateStatus = {
                        id: null,
                        date: date,
                        status: 'A',
                        newsflash: null
                    };
                    dateStatuses.push(newDateStatus);
                    dateMap[date] = {
                        selected: true,
                        dateStatus: newDateStatus
                    };
                    selectedCount++;
                    $('.save-button').prop('disabled', false);
                    $('.preview-button').prop('disabled', false);
                }
                $e.toggleClass('selected', dateMap[date]['selected']);
                $dateSelected.html("");
                buildSortedDatesListHTML($dateSelected, dateStatuses);

                return false;
            }
            return true;
        });

        // Setup the month table scroll checks
        $dateSelect.scroll(checkBounds);
        buildSortedDatesListHTML($dateSelected, dateStatuses);
        checkBounds();
    };

    function buildSortedDatesListHTML(list, dateStatuses) {
        dateStatuses.sort(function(a, b){
            // Sort dateStatuses in ascending order for display
            return new Date(a['date']) - new Date(b['date']);
        }).forEach(function(dateStatus) {
            // Display null values as empty strings
            var dateStatusId = dateStatus['id'] ? dateStatus['id'] : "";
            var dateStatusNewsFlash = dateStatus['newsflash'] ? dateStatus['newsflash'] : "";
            var cancelledSelected = dateStatus['status'] === 'C' ? "selected='selected'" : "";
            var scheduledSelected =  dateStatus['status'] === 'A' ? "selected='selected'" : "";

            // Append selected date
            list.append([
                "<li data-id='" + dateStatusId + "'>",
                    "<span >" + dateStatus['date'] + "</span>",
                    "<select class='status-selector'>",
                        "<option value='A' " + scheduledSelected + ">Scheduled</option>",
                        "<option value='C' " + cancelledSelected + ">Cancelled</option>",
                    "</select>",
                    "<label>",
                        "newsflash message (optional)",
                        "<input ",
                            "type='text' ",
                            "class='newsflash' ",
                            "value='" + dateStatusNewsFlash,
                        "'>",
                    "</label>",
                "</li>",
            ].join(""));
        });
    }

    function isToday(date) {
        return (date.getDate() === today.getDate()
            && date.getMonth() === today.getMonth()
            && date.getFullYear() === today.getFullYear())
    }

    function normalizeDate(date) {
        var jsd = new Date(date);
        jsd.setTime(jsd.getTime() + jsd.getTimezoneOffset()*60*1000);

        return dayjs(jsd).format("YYYY-MM-DD");
    }

    function isSelected(date) {
        return !!dateMap[normalizeDate(date)];
    }

    function makeWeekData(date) {
        // date is the first day in the week
        // [{ day - string to display
        //    classes - classes to display },...]
        var week = [];
        for (var i=0;i<7;i++) {
            var day = {};
            day['day'] = date.getDate();
            day['date'] = normalizeDate(date);
            day['classes'] = (isToday(date) ? "today" : "") + " " + (isSelected(date) ? "selected" : "") + " " + cellClases[date.getMonth()] + (date.getDay() % 2 === 0 ? "-odd" : "");
            day['today'] = isToday(date);
            week.push(day);

            date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        }
        return week;
    }

    function makeMonthData(date) {
        // date is a day in a month to add

        // weeks:
        //   monthTitle - left title, only in first week
        //   weeksInMonth - rows that the title spans
        //   days:
        //     day: title
        //     date: yyyy-m-d (normalized)
        //     selected: cell class if selected

        // Normalize date, ensuring first of month
        var firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        // Find the first day of the week for the week the 1st falls on
        var firstDay = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), -firstOfMonth.getDay()+1);

        var firstOfNextMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
        // Don't include the week next months 1st lands on
        var stopDay = new Date(firstOfNextMonth.getFullYear(), firstOfNextMonth.getMonth(), -firstOfNextMonth.getDay()+1);

        var weeks = [];
        for (var startOfWeek=firstDay;startOfWeek<stopDay;) {
            var week = {};
            week['days'] = makeWeekData(startOfWeek);
            weeks.push(week);

            startOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
        }
        weeks[0]['monthTitle'] = monthNames[firstOfMonth.getMonth()] + " " + firstOfMonth.getFullYear();
        weeks[0]['weeksInMonth'] = weeks.length;

        return {"weeks": weeks};
    }
    function getMonthHTML(date) {
        return Mustache.render(monthTemplate, makeMonthData(date));
    }

    function loadLaterTop() {
        return $loadLater.offset().top - $dateSelect.offset().top;
    }

    function loadEarlierBottom() {
        if ($loadEarlier) {
            return ($loadEarlier.offset().top + $loadEarlier.prop('scrollHeight')) - $dateSelect.offset().top;
        } else {
            return 0;
        }
    }

    var checking = false;
    function checkBounds() {
        if (checking) {
            return;
        }
        var added = false;
        if (loadEarlierBottom() >= 0) {
            latestMonth = new Date(latestMonth.getFullYear(), latestMonth.getMonth()-1, 1);
            var preHeight = $datePicker.height();
            $datePicker.prepend(getMonthHTML(latestMonth));
            var heightChange = $datePicker.height() - preHeight;
            $dateSelect.scrollTop($dateSelect.scrollTop() + heightChange);
            added = true;
        }
        if (loadLaterTop() <= $dateSelect.height()) {
            earliestMonth = new Date(earliestMonth.getFullYear(), earliestMonth.getMonth()+1, 1);
            $datePicker.append(getMonthHTML(earliestMonth));
            added = true;
        }
        if (added) {
            checking = true;
            setTimeout(function() {
                checking = false;
                checkBounds();
            }, 10);
        }
    }

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

}(jQuery));
