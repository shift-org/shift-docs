// uses CONSTANTS from config.js

(function($) {

    var _isFormDirty = false;

    $.fn.cleanFormDirt = function() {
      _isFormDirty = false;
    }

    $.fn.getAddEventForm = function(id, secret, callback) {
        // TODO: loading spinner
        if (id && secret) {
            let url = new URL(API_RETRIEVE_URL);
            url.searchParams.set('id', id);
            url.searchParams.set('secret', secret);

            let opts = {
                type: 'GET',
                url: url.toString(),
                headers: API_HEADERS,
                success: function(data) {
                    data.secret = secret;
                    data.readComic = true;
                    data.codeOfConduct = true;
                    populateEditForm( data, callback );
                },
                error: function(data) {
                    callback( data.responseJSON.error.message );
                }
            };
            $.ajax(opts);
        } else {
            populateEditForm({ datestatuses: [] }, callback);
        }
    };

    function populateTimeOptions(currentValue) {
        var h, m, s, meridian,
            displayHour, displayMinute;
        var option = {};
        var options = [];

        // add 15 minute increments for entire day: 12:00 AM, 12:15 AM, 12:30 AM, etc.
        for ( h = 0; h < 24; h++ ) {
            for ( m = 0; m < 60; m += 15 ) {
                if ( h === 0 ) {
                    displayHour = 12;
                } else if ( h > 12 ) {
                    displayHour = h - 12;
                } else {
                    displayHour = h;
                }

                if ( m === 0 ) {
                    displayMinute = '00';
                } else {
                    displayMinute = m;
                }

                s = '00'; // seconds are always zero

                if ( h > 11 ) {
                    meridian = 'PM';
                } else {
                    meridian = 'AM';
                }

                option = {
                    time: displayHour + ':' + displayMinute + ' ' + meridian,
                    value: h + ':' + displayMinute + ':' + s
                };
                if (h < 10) {
                    // add leading zero, e.g. 07:30
                    option.value = '0' + option.value;
                }

                if (option.value === currentValue) {
                    option.isSelected = true;
                }
                options.push(option);
            }
        }

        // special value for "just before midnight"
        option = {
            time: '11:59 PM',
            value: '23:59:00'
        };
        if (option.value === currentValue) {
            option.isSelected = true;
        }
        options.push(option);

        return options;
    }

    function populateMenuOptions(fieldValues, currentValue) {
        options = [];
        for (let [key, value] of Object.entries(fieldValues)) {
            option = {
                'code': key,
                'text': value,
            };
            if (option.code == currentValue) {
                option.isSelected = true;
            }
            options.push(option);
        }
        return options;
    }

    function populateEditForm(shiftEvent, callback) {
        var template, rendered;

        if (!shiftEvent.time) {
            shiftEvent.time = DEFAULT_TIME;
        }
        shiftEvent.timeOptions = populateTimeOptions(shiftEvent.time);

        if (!shiftEvent.audience) {
            shiftEvent.audience = DEFAULT_AUDIENCE;
        }
        shiftEvent.audienceOptions = populateMenuOptions(AUDIENCE_DESCRIPTION, shiftEvent.audience);

        if (!shiftEvent.area) {
            shiftEvent.area = DEFAULT_AREA;
        }
        shiftEvent.areaOptions = populateMenuOptions(AREA, shiftEvent.area);

        if (!shiftEvent.length) {
            shiftEvent.length = DEFAULT_LENGTH;
        }
        shiftEvent.lengthOptions = populateMenuOptions(LENGTH, shiftEvent.length);

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

          // show the user's selected image after they select it:
          // first, attach to the input button.
          $('#image').on("change", function(evt) {
            const img = $("img.event-image"); // the actual img element
            const input = evt.target;
            const file = input.files && input.files[0];
            // was a file selected and is it an okay size?
            if (!file || (file.size > 1024*1024*2)) {
              // worst comes to worst, it will show an broken image
              // which the user would also see as an error.
              img.attr("src", "/img/cal/icons/image.svg");
            } else {
              const reader = new FileReader();
              reader.onload = function(next) {
                img.attr("src", next.target.result);
              };
              reader.readAsDataURL(file);
            }
          });
        }

        $('.save-button, .publish-button').click(function() {
            let postVars,
                isNew = !shiftEvent.id;
            $('.form-group').removeClass('has-error');
            $('[aria-invalid="true"]').attr('aria-invalid', false);
            $('.help-block').remove();
            $('.save-result').removeClass('text-danger').text('');
            postVars = eventFromForm();
            if (!isNew) {
                postVars['id'] = shiftEvent.id;
            }
            let data = new FormData();
            $.each($('#image')[0].files, function(i, file) {
                data.append('file', file);
            });
            data.append('json', JSON.stringify(postVars));
            let url = new URL(API_MANAGE_URL);
            let opts = {
                type: 'POST',
                url: url.toString(),
                headers: API_HEADERS,
                contentType: false,
                processData: false,
                cache: false,
                data: data,
                success: function(returnVal) {
                    if (returnVal.published) {
                        $('.unpublished-event').remove();
                        $('.published-save-button').show();
                        $('.duplicate-button').show();
                        _isFormDirty = false;
                    }
                    if (!isNew) {
                      $('#success-message').text('Your event has been updated!');
                      $('#success-modal').modal('show');
                      // update the image in case it was changed.
                      let imgDisplay = $('div.image-display').find('a');
                      imgDisplay.attr("href", returnVal.image);
                      imgDisplay.find("img").attr("src", returnVal.image);
                    } else {
                        let newUrl = 'event-submitted';
                        history.pushState({}, newUrl, newUrl);
                        // hide the edit button on the page
                        $('.edit-buttons').prop('hidden', true);
                        // set the text of the page
                        $('#mustache-html').html('<p>Event submitted! Check your email to finish publishing your event.</p><p><a href="/calendar/">See all upcoming events</a> or <a href="/addevent/">add another event</a>.</p>');
                        _isFormDirty = false;
                        $('#submit-email').text(postVars.email);
                        $('#submit-modal').modal('show');
                    }
                    shiftEvent.id = returnVal.id;
                },
                error: function(returnVal) {
                    var err, okGroups, errGroups;

                    // get the error message:
                    if (returnVal.responseJSON) {
                      err = returnVal.responseJSON.error;
                    } else if (returnVal.status === 413) {
                      // 413 - "Request Entity Too Large" gets sent by nginx above its client_max_body_size;
                      // so the error message sent by flourish.
                      err = {
                        message: 'There were errors in your fields',
                        fields: {
                          file: 'Your image was too large.',
                        }
                      };
                    } else {
                      err = {
                       message: 'Server error saving event!'
                      };
                    }
                    // munge the "file" errors to be "image" errors
                    // so that the error message shows on proper line.
                    if (err.fields && err.fields.file && !err.fields.image) {
                      err.fields.image = err.fields.file;
                    }

                    // process the errors:
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
            $.ajax(opts);
        });

        $(document).off('click', '.preview-button')
            .on('click', '.preview-button', function(e) {
            previewEvent(shiftEvent, function(eventHTML) {
                // first, find the edit image
                const img = $(".event-image");
                // render the new html preview:
                const out = $('#mustache-html');
                out.append(eventHTML);
                // copy the image source from the edit image to the preview:
                const imgPreview = out.find('img.lazy');
                imgPreview.attr("src", img.attr("src"));
                imgPreview.removeClass("lazy");
            });
        });

        $(document).off('click', '.duplicate-button')
            .on('click', '.duplicate-button', function(e) {
            shiftEvent.id = '';
            shiftEvent.secret = '';
            shiftEvent.datestatuses = [];
            shiftEvent.image = '';
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

        previewEvent['displayStartTime'] = dayjs(previewEvent['time'], 'hh:mm:ss').format('h:mm A');
        if ( previewEvent['eventduration'] ){
            var endTime = dayjs(previewEvent['time'], 'hh:mm:ss')
                .add(previewEvent['eventduration'], 'minutes')
                .format('HH:mm');
            previewEvent['endtime'] = endTime; // e.g. 18:00
            previewEvent['displayEndTime'] = dayjs(endTime, 'HH:mm').format('h:mm A'); // e.g. 6:00 PM
        }

        // set values for print contact fields if enabled
        var printContactFields = [ 'email', 'phone', 'contact', 'weburl' ];
        printContactFields.forEach((field) => {
            previewEvent[`printpreview${field}`] = $(`#print${field}`).is(":checked") ? $(`#${field}`).val() : null;
        });

        // clear private fields if hidden
        var privateContactFields = [ 'email', 'phone', 'contact' ];
        privateContactFields.forEach((field) => {
            previewEvent[`${field}`] = $(`#hide${field}`).is(":checked") ? null : $(`#${field}`).val();
        });

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
            var date = dayjs(value.date).format('dddd, MMMM D, YYYY');
            var displayDate = dayjs(value.date).format('ddd, MMM D, YYYY');
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

    function deleteEvent(id, secret) {
        let data = new FormData();
        data.append('json', JSON.stringify({
            id: id,
            secret: secret
        }));
        let url = new URL(API_DELETE_URL);
        let opts = {
            type: 'POST',
            url: url.toString(),
            headers: { 'Api-Version': API_VERSION },
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

    // Set up email error detection and correction
    $(document).on( 'blur', '#email', function () {
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

    $(document).on('click', '#email-suggestion .correction', function () {
        $('#email').val( $( this ).text() );
        $('#email-suggestion')
            .hide();
    } );

    $(document).on('click', '#email-suggestion .glyphicon-remove', function () {
        $('#email-suggestion')
            .hide();
        // They clicked the X button, turn mailcheck off
        // TODO: Remember unwanted corrections in local storage, don't offer again
        $(document).off('blur', '#email');
    } );

    $(document).on('click', '.preview-edit-button', function() {
        $('#event-entry').show();
        $('.date').remove();
        $('.preview-button').show();
        $('.preview-edit-button').hide();
    });

    $(document).on('click', '#confirm-cancel', function() {
        $.fn.cleanFormDirt();
        window.location.href = '/calendar/';
    });

    $(document).off('click', '#confirm-delete')
        .on('click', '#confirm-delete', function() {
            $.fn.cleanFormDirt();
            deleteEvent(id.value, secret.value);
        });

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
