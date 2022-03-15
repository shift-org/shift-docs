(function($) {

    var _isFormDirty = false;

    $.fn.cleanFormDirt = function() {
      _isFormDirty = false;
    }

    $.fn.getAddEventForm = function(id, secret, callback) {
        if (id && secret) {
            // TODO: loading spinner
            $.ajax({
                url: '/api/retrieve_event.php?id=' + id + "&secret=" + secret,
                type: 'GET',
                success: function(data) {
                    data.secret = secret;
                    data.readComic = true;
                    data.codeOfConduct = true;
                    populateEditForm( data, callback );
                },
                error: function(data) {
                    callback( data.responseJSON.error.message );
                }
            });
        } else {
            populateEditForm({ datestatuses: [] }, callback);
        }
    };

    function populateEditForm(shiftEvent, callback) {
        var i, h, m, meridian,
            displayHour, displayMinute, timeChoice,
            template, rendered, item,
            lengths = [ '0-3', '3-8', '8-15', '15+'],
            audiences = [{code: 'F', text: 'Family friendly. Adults bring children.'},
                         {code: 'G', text: 'General. For adults, but kids welcome.'},
                         {code: 'A', text: '21+ only.'}],
            areas = [{code: 'P', text: 'Portland'},
                {code: 'V', text: 'Vancouver'}];

        shiftEvent.lengthOptions = [];
        for ( i = 0; i < lengths.length; i++ ) {
            item = {range: lengths[i]};
            if (shiftEvent.length == lengths[i]) {
                item.isSelected = true;
            }
            shiftEvent.lengthOptions.push(item);
        }

        shiftEvent.timeOptions = [];
        meridian = 'AM';
        for ( h = 0; h < 24; h++ ) {
            for ( m = 0; m < 60; m += 15 ) {
                if ( h > 11 ) {
                    meridian = 'PM';
                }
                if ( h === 0 ) {
                    displayHour = 12;
                } else if ( h > 12 ) {
                    displayHour = h - 12;
                } else {
                    displayHour = h;
                }
                displayMinute = m;
                if ( displayMinute === 0 ) {
                    displayMinute = '00';
                }
                timeChoice = {
                    time: displayHour + ':' + displayMinute + ' ' + meridian,
                    value: h + ':' + displayMinute + ':00'
                };
                if (h < 10) {
                    timeChoice.value = '0' + timeChoice.value;
                }
                if (shiftEvent.time === timeChoice.value) {
                    timeChoice.isSelected = true;
                }
                shiftEvent.timeOptions.push(timeChoice);
            }
        }
        shiftEvent.timeOptions.push({ time: "11:59 PM" });
        if (!shiftEvent.time) {
            // default to 5:00pm if not set;
            // 0 = 12:00am, 1 = 12:15am, 2 = 12:30am, ... 68 = 5:00pm
            shiftEvent.timeOptions[68].isSelected = true;
        }

        if (!shiftEvent.audience) {
            shiftEvent.audience = 'G';
        }
        shiftEvent.audienceOptions = [];
        for ( i = 0; i < audiences.length; i++ ) {
            if (shiftEvent.audience == audiences[i].code) {
                audiences[i].isSelected = true;
            }
            shiftEvent.audienceOptions.push(audiences[i]);
        }

        if (!shiftEvent.area) {
            shiftEvent.area = 'P';
        }
        shiftEvent.areaOptions = [];
        for ( i = 0; i < areas.length; i++ ) {
            if (shiftEvent.area == areas[i].code) {
                areas[i].isSelected = true;
            }
            shiftEvent.areaOptions.push(areas[i]);
        }

        template = $('#mustache-edit').html();
        rendered = Mustache.render(template, shiftEvent);
        callback(rendered);

        $('#date-select').setupDatePicker(shiftEvent['datestatuses'] || []);

        if (shiftEvent['datestatuses'].length === 0) {
            $('.save-button').prop('disabled', true);
            $('.preview-button').prop('disabled', true);
        }

        if (shiftEvent.published) {
          $('.published-save-button').show();
          $('.duplicate-button').show();
        }

        $('.save-button, .publish-button').click(function() {
            var postVars,
                isNew = !shiftEvent.id;
            $('.form-group').removeClass('has-error');
            $('[aria-invalid="true"]').attr('aria-invalid', false);
            $('.help-block').remove();
            $('.save-result').removeClass('text-danger').text('');
            postVars = eventFromForm();
            if (!isNew) {
                postVars['id'] = shiftEvent.id;
            }
            var data = new FormData();
            $.each($('#image')[0].files, function(i, file) {
                data.append('file', file);
            });
            data.append('json', JSON.stringify(postVars));
            var opts = {
                type: 'POST',
                url: '/api/manage_event.php',
                contentType: false,
                processData: false,
                cache: false,
                data: data,
                success: function(returnVal) {
                    var msg = isNew ?
                        'Thank you! A link with a URL to edit and manage the ' +
                            'event has been emailed to ' + postVars.email + '. ' +
                            'You must follow this link and publish the event for it to become visible. ' +
                            'If you don\'t receive that email within 20 minutes, please contact bikecal@shift2bikes.org for help.' :
                        'Your event has been updated!';
                    if (returnVal.published) {
                        $('.unpublished-event').remove();
                        $('.published-save-button').show();
                        $('.duplicate-button').show();
                        _isFormDirty = false;
                    }

                    if (isNew) {
                        var newUrl = 'event-submitted';
                        history.pushState({}, newUrl, newUrl);
                        $('.edit-buttons').prop('hidden', true);
                        $('#mustache-html').html('<p>Event submitted! Check your email to finish publishing your event.</p><p><a href="/calendar/">See all upcoming events</a> or <a href="/addevent/">add another event</a>.</p>');
                        _isFormDirty = false;
                    }
                    $('#success-message').text(msg);
                    $('#success-modal').modal('show');
                    shiftEvent.id = returnVal.id;
                },
                error: function(returnVal) {
                    var err = returnVal.responseJSON
                                ? returnVal.responseJSON.error
                                : { message: 'Server error saving event!' },
                        okGroups,
                        errGroups;

                    $('.save-result').addClass('text-danger').text(err.message);

                    $.each(err.fields, function(fieldName, message) {
                        var input = $('[name=' + fieldName + ']'),
                            parent = input.closest('.form-group,.checkbox'),
                            label = $('label', parent);
                        input.attr('aria-invalid', true);
                        parent
                            .addClass('has-error')
                            .append('<div class="help-block">' + message + '</div>');
                        $('.help-block .field-name', parent).text(
                            label.text().toLowerCase()
                        );
                    });

                    // Collapse groups without errors, show groups with errors
                    errGroups = $('.has-error').closest('.panel-collapse');
                    okGroups = $('.panel-collapse').not(errGroups);
                    errGroups.collapse('show');
                    okGroups.collapse('hide');
                    $('.preview-edit-button').click();
                }
            };
            if(data.fake) {
                opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr(); xhr.send = xhr.sendAsBinary; return xhr; }
                opts.contentType = "multipart/form-data; boundary="+data.boundary;
                opts.data = data.toString();
            }
            $.ajax(opts);
        });

        $(document).off('click', '.preview-button')
            .on('click', '.preview-button', function(e) {
            previewEvent(shiftEvent, function(eventHTML) {
                $('#mustache-html').append(eventHTML);
            });
        });

        $(document).off('click', '.duplicate-button')
            .on('click', '.duplicate-button', function(e) {
            shiftEvent.id = '';
            shiftEvent.secret = '';
            shiftEvent.datestatuses = [];
            shiftEvent.codeOfConduct = false;
            shiftEvent.readComic = false;
            populateEditForm(shiftEvent, function(eventHTML) {
                var newUrl = '/addevent/';
                history.pushState({}, newUrl, newUrl);
                $('#mustache-html').empty().append(eventHTML);
                $('html, body').animate({
                  scrollTop: 0
                }, 1000)
            });
        });

        checkForChanges();
    }

    function previewEvent(shiftEvent, callback) {
        var previewEvent = {},
            mustacheData;
        var $form = $('#event-entry');
        $.extend(previewEvent, shiftEvent, eventFromForm());

        previewEvent['displayStartTime'] = previewEvent['time'];
        if ( previewEvent['eventduration'] ){
            var endTime = moment(previewEvent['time'], 'hh:mm A')
                .add(previewEvent['eventduration'], 'minutes')
                .format('HH:mm');
            previewEvent['endtime'] = endTime; // e.g. 18:00
            previewEvent['displayEndTime'] = moment(endTime, 'HH:mm').format('h:mm A'); // e.g. 6:00 PM
        }

        previewEvent['audienceLabel'] = $form.getAudienceLabel(previewEvent['audience']);
        previewEvent['length'] += ' miles';
        previewEvent['mapLink'] = $form.getMapLink(previewEvent['address']);
        previewEvent['webLink'] = $form.getWebLink(previewEvent['weburl']);
        previewEvent['contactLink'] = $form.getContactLink(previewEvent['contact']);

        $form.hide();
        mustacheData = {
            dates:[],
            preview: true,
            expanded: true
        };
        $.each(previewEvent.datestatuses, function(index, value) {
            var date = $form.formatDate(value['date']);
            var displayDate = $form.formatDate(value['date'], abbreviated=true);
            var newsflash = value['newsflash'];
            var cancelled = (value['status'] === 'C');
            mustacheData.dates.push({
                date: date,
                displayDate: displayDate,
                newsflash: newsflash,
                cancelled: cancelled,
                caldaily_id: index,
                events: [previewEvent],
            });
        });
        $('.preview-button').hide();
        $('.preview-edit-button').show();
        var template = $('#view-events-template').html();
        var info = Mustache.render(template, mustacheData);
        callback(info);
    }

    function eventFromForm() {
        var harvestedEvent = {};
        $('form').serializeArray().map(function (x) {
            harvestedEvent[x.name] = x.value;
        });
        harvestedEvent['datestatuses'] = $('#date-picker').dateStatusesList();
        return harvestedEvent;
    }

    // Set up email error detection and correction
    $( document ).on( 'blur', '#email', function () {
        $( this ).mailcheck( {
            suggested: function ( element, suggestion ) {
                var template = $( '#email-suggestion-template' ).html(),
                    data = { suggestion: suggestion.full },
                    message = Mustache.render( template, data );
                $( '#email-suggestion' )
                    .html( message )
                    .show();
            },
            empty: function ( element ) {
                $( '#emailMsg' )
                    .hide();
            }
        } );
    } );

    $( document ).on( 'click', '#email-suggestion .correction', function () {
        $( '#email' ).val( $( this ).text() );
        $( '#email-suggestion' )
            .hide();
    } );

    $( document ).on( 'click', '#email-suggestion .glyphicon-remove', function () {
        $( '#email-suggestion' )
            .hide();
        // They clicked the X button, turn mailcheck off
        // TODO: Remember unwanted corrections in local storage, don't offer again
        $( document ).off( 'blur', '#email' );
    } );

    function checkForChanges() {
        $(':input').on('input', function () {
          _isFormDirty = true;
        });
        // this doesn't detect changes in the date picker yet;
        // TODO more checks to listen for changes there

        window.addEventListener('beforeunload', function (e) {
          if (_isFormDirty) {
            e.preventDefault();
            e.returnValue = '';
          }
        });
        return 0;
    };

}(jQuery));
