(function($) {

    // Global state variables, initialized in setupDatePicker
    //-------------------
    // the scrolling container of the grid of days
    let $dateSelect;
    // the grid of days minus the top and bottom "loading zones"
    let $datePicker;
    // the displayed list of user selected dates
    let $dateSelected;
    // html template from #mustache-select-month
    let monthTemplate;
    // these two start at the current month
    // and grow to encompass the range of months displayed
    // ( generated ) by the date picker.
    let earliestMonth, latestMonth;
    let dateMap; // maps utc YYYY-MM-DD -> { selected, dateStatus }

    // scroll increment when pressing next/prev
    // note: a week is about 28 units high..
    const scrollStep = 112;

    // called by addevent.js
    $.fn.dateStatusesList = function() {
        const selectedDates = $("#date-selected li").toArray();
        return selectedDates.map(date => {
          return {
            id: date.getAttribute('data-id'),
            date:date.querySelector('span').innerHTML,
            status: date.querySelector('select').value,
            newsflash: date.querySelector('.newsflash').value,
          };
        });
    };

    // sets up the global variables and populates the date picker element
    $.fn.setupDatePicker = function(dateStatuses) {
        // Fill in global variables
        // Set up dateMap
        dateMap = {};
        dateStatuses.forEach(function(dateStatus) {
            dateMap[toUtcString(dateStatus['date'])] = {
                selected: true,
                dateStatus: dateStatus
            }
        });

        // Scrolling container for the table
        $dateSelect = $('#date-select');
        // the displayed list of user selected dates
        $dateSelected = $('#date-selected');
        // Table that contains months
        $datePicker = $("#date-picker");
        // template for a single month
        monthTemplate = $('#mustache-select-month').html();

        initDatePicker();

        // Add a click handler for individual days
        $datePicker.click(function(ev) {
            var e = ev.target;
            if (e.hasAttribute('data-date')) {
                var $e = $(e);
                var date = $e.attr('data-date');

                if (date in dateMap) {
                    dateMap[date]['selected'] = !dateMap[date]['selected'];
                    if (dateMap[date]['selected']) {
                        dateStatuses.push(dateMap[date]['dateStatus']);
                        $('.save-button').prop('disabled', false);
                        $('.preview-button').prop('disabled', false);
                    } else {
                        var match = dateStatuses.findIndex(function(deselectedDate) {
                            return deselectedDate['date'] == date;
                        });
                        dateStatuses.splice(match, 1);
                        // fix? this doesn't disable the "publish" button
                        // ex. if the user unselects all dates before publication.
                        if ( !dateStatuses.length ) {
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
    };

    // generate the "selected days" list
    function buildSortedDatesListHTML(list, dateStatuses) {
        dateStatuses.sort(function(a, b){
            // Sort dateStatuses in ascending order for display
            return dayjs(a.date).diff( dayjs(b.date) );
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
        return dayjs().isSame(date, 'day');
    }

    // return the utc YYYY-MM-DD string of the passed date
    // note: 'date' is sometimes a utc string, or a dayjs object.
    // see also: main.js viewEvents()
   function toUtcString(date) {
        // tbd: does the server actually handle dates as utc?
        // i believe times ( ex. start times ) are assumed local.
        return dayjs(date).utc().format('YYYY-MM-DD');
    }

    function isSelected(date) {
        return !!dateMap[toUtcString(date)];
    }

    // return an week of data for makeMonthData
    // assumes that "start" is a sunday.
    function makeWeekData(start) {
        // [{ day - string to display
        //    classes - classes to display },...]
        let week = [];
        for (let i=0; i<7; i++) {
            const date = start.add(i, 'day');
            const today = isToday(date);
            const monthAbbr = date.format("MMM").toLowerCase(); // jan, dec
            const classes = [
              today ? "today" : "",
              isSelected(date) ? "selected" : "",
              // ex: color-apr-odd
              // note: odd is actually placed on the even days.
              "color-" + monthAbbr + ((i % 2) === 0 ? "-odd" : ""),
            ];
            //
            week.push({
              day: date.date(),        // day of the month ( as a number )
              date: toUtcString(date), // date utc as a YYYY-MM-DD
              classes: classes.join(" "),
              today,
            });
        }
        return week;
    }

    // generate data describing the month containing the passed date.
    // ( via the #mustache-select-month template in edit.html )
    function makeMonthData(date) {
        // weeks:
        //   monthTitle - left title, only in first week
        //   weeksInMonth - rows that the title spans
        //   days:
        //     day: title
        //     date: yyyy-m-d (normalized)
        //     selected: cell class if selected
        let weeks = [];
        // the sunday before the first of the month ( can be the previous month )
        const firstDay = date.startOf('month').startOf('week');
        // the sunday before the first of *next* month ( can be this month )
        const stopDay = date.add(1, 'month').startOf('month').startOf('week');
        // stop *before* the week containing next month
        // ( the next month will add that week as its first week. )
        for (let d= firstDay; d.isBefore(stopDay, 'day'); d = d.add(1, 'week')) {
            weeks.push({
              days: makeWeekData(d) // an array of 7 days.
            });
        }
        // the vertically oriented label on the side of the picker
        weeks[0]['monthTitle'] = date.format("MMMM YYYY") // ex. January 2024
        // indicates the height of the label: the number of rows (weeks) it should span
        weeks[0]['weeksInMonth'] = weeks.length;
        return {weeks};
    }

    // generate html for the month containing the passed date
    // ( displayed by the date picker )
    function getMonthHTML(date) {
        return Mustache.render(monthTemplate, makeMonthData(date));
    }

    // add new html when needed.
    // called from a scrolling event;
    // ( the scrolling event can be initiated by next/prev/today buttons )
    function checkBounds() {
        const grid = $dateSelect.get(0);
        const currTop = grid.scrollTop;
        // we're at the top; add some more events above.
        if (currTop < scrollStep) {
            const preHeight  = $datePicker.height();
            earliestMonth = earliestMonth.subtract(1, 'month');
            $datePicker.prepend(getMonthHTML(earliestMonth));

            // try to keep the same position as before
            const heightChange = $datePicker.height() - preHeight;
            grid.scrollTop = currTop + heightChange;
        }
        else {
            // we're at the bottom: add some more events below.
            // ( offset height is the fixed size element height )
            // https://stackoverflow.com/questions/3962558/javascript-detect-scroll-end
            const currBottom = currTop + grid.offsetHeight;
            if (currBottom >= grid.scrollHeight) {
                latestMonth = latestMonth.add(1, 'month');
                $datePicker.append(getMonthHTML(latestMonth));
            }
        }
    }

    // generate the initial html
    // fix: should this scroll the first scheduled day into view
    // ( ex. when editing existing events )
    function initDatePicker() {
        const now = dayjs();
        earliestMonth = now;
        latestMonth = now.add(1, 'month');

        // note: on chrome, if you prepend the earlier month here;
        // the previous month winds up starting as the top month.
        $datePicker.html(getMonthHTML(now));
        $datePicker.append(getMonthHTML(latestMonth));
        const grid = $dateSelect.get(0);
        // however, we need to add a slight default offset
        // otherwise, the top is at 0, and the user cant drag scroll upward
        // as a side effect this triggers checkBounds
        // and the previous month gets added anyway.
        grid.scrollTop = 1;
    }

    // get the element on the datepicker containing today's date
    function todaysElement() {
      // tbd: can this use $datePicker?
      return $("#date-picker .calendar-day.today")[0];
    }

    // the user has clicked the prev/left arrow button
    // scroll to an earlier month.
    $(document).on('click', '#date-picker-prev-month', function(ev) {
        const currentPosition = $dateSelect.scrollTop();
        $dateSelect.scrollTop(currentPosition - scrollStep);
    });

    // the user has clicked the next/right arrow button
    // scroll to a later month.
    $(document).on('click', '#date-picker-next-month', function(ev) {
        const currentPosition = $dateSelect.scrollTop();
        $dateSelect.scrollTop(currentPosition + scrollStep);
    });

    // the user has clicked the "today" button.
    // scroll so that the current day is visible.
    $(document).on('click', '#date-picker-today', function(ev) {
        const today = todaysElement();
        today.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
        });
    });

}(jQuery));
