(function($) {

    $.fn.getAddEventForm = function(id, secret, callback) {
        if (id && secret) {
            // TODO: loading spinner
            $.get( 'retrieve_event.php?id=' + id + "&secret=" + secret, function( data ) {
                if (data.error) {
                    callback( 'This event has been deleted.' );
                    return
                }
                data.secret = secret;
                data.readComic = true;
                populateEditForm( data, callback );
            });
        } else {
            populateEditForm({ dates: [] }, callback);
        }
    };

    function populateEditForm(shiftEvent, callback) {
        var i, h, m, meridian,
            displayHour, displayMinute, timeChoice,
            template, rendered, item,
            lengths = [ '0-3', '3-8', '8-15', '15+'],
            audiences = [{code: 'F', text: 'Family friendly. Adults bring children.'},
                         {code: 'G', text: 'General. For adults, but kids welcome.'},
                         {code: 'A', text: '21+ only. Alcohol involved.'}],
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

        $('#date-select').setupDatePicker(shiftEvent['dates'] || []);

        $('#edit-header').affix({
            offset: {
                top: 100
            }
        });
        if (shiftEvent.dates.length === 0) {
            $('#save-button').prop('disabled', true);
            $('#preview-button').prop('disabled', true);
        }
        $('#save-button').click(function() {
            var postVars,
                isNew = !shiftEvent.id;
            $('.form-group').removeClass('has-error');
            $('[aria-invalid="true"]').attr('aria-invalid', false);
            $('.help-block').remove();
            $('#save-result').removeClass('text-danger').text('');
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
                url: 'manage_event.php',
                contentType: false,
                processData: false,
                cache: false,
                data: data,
                success: function(returnVal) {
                    var msg = isNew ?
                        'Thank you! A link with a URL to edit and manage the ' +
                            'event has been emailed to ' + postVars.email +
                            '. You must click this link for the event to become visible.  If you don\'t receive that email within 20 minutes, please contact bikecal@shift2bikes.org for help.' :
                        'Your event has been updated!';

                    if (returnVal.secret) {
                        var newUrl = 'editEvent-' + returnVal.id + '-' + returnVal.secret;
						history.pushState({}, newUrl, newUrl);
                        $('#secret').val(returnVal.secret);
                        msg += ' You may also bookmark the current URL before you click OK.'
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

                    $('#save-result').addClass('text-danger').text(err.message);

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
                    $('#preview-edit-button').click();
                }
            };
            if(data.fake) {
                opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr(); xhr.send = xhr.sendAsBinary; return xhr; }
                opts.contentType = "multipart/form-data; boundary="+data.boundary;
                opts.data = data.toString();
            }
            $.ajax(opts);
        });

        $(document).off('click', '#preview-button')
            .on('click', '#preview-button', function(e) {
            previewEvent(shiftEvent, function(eventHTML) {
                $('#mustache-html').append(eventHTML);
            });
        });
    }

    function previewEvent(shiftEvent, callback) {
        var previewEvent = {},
            mustacheData;
        var $form = $('#event-entry');
        $.extend(previewEvent, shiftEvent, eventFromForm());
        previewEvent.displayTime = previewEvent.time;
        previewEvent['length'] += ' miles';
        previewEvent['mapLink'] = $form.getMapLink(previewEvent['address']);
        $form.hide();
        mustacheData = {
            dates:[],
            preview: true,
            expanded: true
        };
        $.each(previewEvent.dates, function(index, value) {
            var date = $form.formatDate(value);
            mustacheData.dates.push({ date: date, events: [previewEvent] });
        });
        $('#preview-button').hide();
        $('#preview-edit-button').show();
        var template = $('#view-events-template').html();
        var info = Mustache.render(template, mustacheData);
        callback(info);
    }

    function eventFromForm() {
        var harvestedEvent = {};
        $('form').serializeArray().map(function (x) {
            harvestedEvent[x.name] = x.value;
        });
        harvestedEvent['dates'] = $('#date-picker').dateList();
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

}(jQuery));
