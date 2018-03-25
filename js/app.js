/* global gapi */
/* global Bind */
/* global $ */

var CLIENT_ID = '712538785806-7f6lggo668ua7skec0au0n9qmb1n8mrr.apps.googleusercontent.com';
var docId = '';
var weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var MINUTE_INCREMENT = 30 * 60 * 1000;
var currentLocation = { 'latitude': 'unknown', 'longitude': 'unknown', 'altitude': 'unknown' };
$('.version').html('0.0.12');

$(document).on("pageinit", "#pageData", function(event) {
    showOverflow();
    gapi.load('client:auth2', initClient);
});
$(document).on("pageinit", "#pagePrivacy", function(event) {
    hideOverflow();
});

function iso(someDate) {
    var month = ((someDate.getMonth() + 1) < 10 ? '0' : '') + (someDate.getMonth() + 1)
    var hour = (someDate.getHours() < 10 ? '0' : '') + someDate.getHours();
    var minute = (someDate.getMinutes() < 10 ? '0' : '') + someDate.getMinutes();
    return (1900 + someDate.getYear()) + '-' + month + '-' + someDate.getDate() + ' ' + hour + ':' + minute;
}


function save(eventType, string, date, severity) {

    var params = {
        spreadsheetId: docId,
        range: 'Data!A1:Z1',
        valueInputOption: 'USER_ENTERED'
    };
    var data = [];
    // WARNING ****************************************************************
    // WARNING ****************************************************************
    // WARNING ****************************************************************
    // If you change the order here, you have to do a major version upgrade and
    // migrate google sheets.
    data.push(eventType);
    data.push('\'' + string.trim());
    data.push(severity);
    data.push(iso(date));
    data.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    pushGeo(data);
    // WARNING ****************************************************************
    // WARNING ****************************************************************
    // WARNING ****************************************************************

    var valueRangeBody = {
        'range': 'Data!A1:Z1',
        'majorDimension': 'ROWS',
        'values': [
            data
        ],
    }

    var request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    request.then(function(response) {
        console.log('Inserted: ' + JSON.stringify(response.result));
        $('.action').hide();
        addItemToAutocomplete(eventType, string);
        $('#' + eventType).val('');
        $('#' + eventType + 'List').children('li').addClass('ui-screen-hidden');
        $('#' + eventType + 'Success').show().fadeOut(2000);
    }, function(reason) {
        console.error('error: ' + reason.result.error.message);
        $('.action').hide();
        $('#' + eventType + 'Failed').html(reason.result.error.message).show();
    });
}

function pushGeo(data) {
    data.push(currentLocation.latitude ? currentLocation.latitude : 'unknown');
    data.push(currentLocation.longitude ? currentLocation.longitude : 'unknown');
    data.push(currentLocation.altitude ? currentLocation.altitude : 'unknown');
}

function findOrCreateDocId() {

    $('#overlay').html('Searching for tracker sheet');
    gapi.client.drive.files.list({
        q: "name='food-diary-data'",
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
        pageToken: null
    }).then(function(response) {
        var files = response.result.files;
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                docId = file.id;
                console.log('found: ' + docId);
                getUniqueValues();
                break;
            }
        }
        else {
            $('#overlay').html('Creating new sheet food-diary-data in google drive');
            gapi.client.sheets.spreadsheets.create({}, {
                "sheets": [{
                        "properties": {
                            "title": "Data",
                            "gridProperties": {
                                "rowCount": 10000,
                                "columnCount": 50,
                                "frozenRowCount": 1
                            },
                            "tabColor": {
                                "red": 0.1,
                                "green": 0.7,
                                "blue": 0.2
                            }
                        }
                    },
                    {
                        "properties": {
                            "title": "Unique",
                            "gridProperties": {
                                "rowCount": 10000,
                                "columnCount": 50,
                                "frozenRowCount": 1
                            },
                            "tabColor": {
                                "red": 0.7,
                                "green": 0.1,
                                "blue": 0.1
                            }
                        }
                    }
                ]
            }).then(function(response) {
                    $('#overlay').html('Created!  Setting title');
                    docId = response.result.spreadsheetId;
                    gapi.client.sheets.spreadsheets.batchUpdate({
                        spreadsheetId: docId,
                        resource: {
                            requests: [{
                                updateSpreadsheetProperties: {
                                    properties: {
                                        title: "food-diary-data"
                                    },
                                    fields: 'title'
                                }
                            }]
                        }
                    }).then((response) => {
                        var params = {
                            spreadsheetId: docId,
                            range: 'Data!A1:Z1',
                            valueInputOption: 'USER_ENTERED'
                        };
                        var valueRangeBody = {
                            'range': 'Data!A1:Z1',
                            'majorDimension': 'ROWS',
                            'values': [
                                ['Event Type', 'Value', 'Severity', 'Date Time', 'Timezone', 'Latitude', 'Longitude', 'Altitude']
                            ],
                        }

                        $('#overlay').html('Adding data sheet');
                        gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody).then(function(response) {
                            console.log('Inserted: ' + JSON.stringify(response.result));
                            $('#overlay').html('Inserted');
                        }, function(reason) {
                            $('#overlay').html('Error: ' + reason.result.error.message);
                        });

                        var params = {
                            spreadsheetId: docId,
                            range: 'Unique!A1:Z1',
                            valueInputOption: 'USER_ENTERED'
                        };
                        var valueRangeBody = {
                            'range': 'Unique!A1:Z1',
                            'majorDimension': 'ROWS',
                            'values': [
                                ['Unique Causes', 'Unique Effects'],
                                ['=sort(Unique(FILTER(Data!B2:B,Data!A2:A="cause")))', '=sort(Unique(FILTER(Data!B2:B,Data!A2:A="effect")))'],
                            ],
                        }

                        $('#overlay').html('Adding another data sheet');
                        gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody).then(function(response) {
                            console.log('Inserted: ' + JSON.stringify(response.result));
                            $('#overlay').html('Inserted');
                            hideOverflow();
                        }, function(reason) {
                            $('#overlay').html('Error: ' + reason.result.error.message);
                        });
                    });
                },
                function(reason) {
                    $('#overlay').html('Error: ' + reason.result.error.message);
                });
        }
    });
}

function hideOverflow() {
    $('body').css('overflow', 'auto');
    $('#overlay').hide();
}

function showOverflow() {
    $('body').css('overflow', 'hidden');
    $('#overlay').html('Logged out').show();
}

function initClient() {
    $('#overlay').html('Starting up!');
    var SCOPE = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';

    gapi.client.init({
        'clientId': CLIENT_ID,
        'scope': SCOPE,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4', "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    }).then(function() {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        setupUi();
    });
}


function updateSignInStatus(isSignedIn) {
    if (isSignedIn) {
        $('#buttonLogin').hide();
        $('#buttonLogout').show();
        findOrCreateDocId();
        getLocation();
    }
    else {
        showOverlay();
    }
}

function getUniqueValues() {
    var params = {
        spreadsheetId: docId,
        range: 'Unique!A2:B',
        majorDimension: 'COLUMNS'
    };

    $('#overlay').html('Loading autocomplete');
    var request = gapi.client.sheets.spreadsheets.values.get(params);
    request.then(function(response) {
        if (response.result.values && response.result.values[0]) {
            var causes = response.result.values[0];
            var htmlCause = '';
            for (var cause of causes) {
                if (htmlCause.indexOf('>' + cause.trim().toLowerCase() + '<') === -1) {
                    htmlCause += "<li>" + cause.trim().toLowerCase() + "</li>";
                }
            }
            resetAutocompleteData('cause', htmlCause);
        }
        if (response.result.values && response.result.values[1]) {
            var effects = response.result.values[1];
            var htmlEffect = '';
            for (var effect of effects) {
                if (htmlEffect.indexOf('>' + effect.trim().toLowerCase() + '<') === -1) {
                    htmlEffect += "<li>" + effect.trim().toLowerCase() + "</li>";
                }
            }
            resetAutocompleteData('effect', htmlEffect);
        }
        hideOverflow();
    }, function(reason) {
        $('#overlay').html('error loading autocomplete from spreadsheet: ' + reason.result.error.message);
        console.error('error: ' + reason.result.error.message);
    });
}

function addItemToAutocomplete(eventType, data) {
    var existing = $('#' + eventType + 'List').html();
    if (existing.indexOf('>' + data.trim().toLowerCase() + '<') === -1) {
        existing += '<li>' + data.trim().toLowerCase() + '</li>';
        resetAutocompleteData(eventType, existing)
    }
}

function resetAutocompleteData(eventType, existing) {
    $('#' + eventType + 'List').html(existing);
    $('#' + eventType + 'List').listview("refresh");
    $('#' + eventType + 'List').trigger("updatelayout");
    $('#' + eventType + 'List').on('click', function() {
        $(this).children('li').addClass('ui-screen-hidden');
    })
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(geoSuccess);
    }
    else {
        // do nothing
    }
}

function geoSuccess(geo) {
    currentLocation = {
        'latitude': geo.coords.latitude,
        'longitude': geo.coords.longitude,
        'altitude': geo.coords.altitude
    };
    console.log(currentLocation);
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}


function handleSignInClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}


function setupUi() {
    $('.date-slider').on('change', function() {
        updateDateValue(this.id);
    });

    function updateDateValue(selector) {
        var current = new Date();
        var dateValue = getDateValue(selector);
        var day = dateValue.getDay();
        var hour = dateValue.getHours();
        var minutes = dateValue.getMinutes() == 0 ? '00' : dateValue.getMinutes();
        var prefix = current.getDate() == dateValue.getDate() ? 'Today' : current.getDate() - 1 == dateValue.getDate() ? 'Yesterday' : 'Last ' + weekday[day];
        new Date($('#' + selector + 'Output').html(prefix + ' at ' + (hour % 12 === 0 ? 12 : hour % 12) + ':' + minutes + (hour < 12 ? 'am' : 'pm')));
    }

    function getDateValue(selector) {
        var slideValue = $('#' + selector).val();
        var current = new Date();
        return new Date((Math.round(current.getTime() / MINUTE_INCREMENT) * MINUTE_INCREMENT) - ((100 - slideValue) * MINUTE_INCREMENT));
    }

    $('.date-slider').each(function() {
        updateDateValue(this.id);
    });

    $('#saveCauseButton').on('click', function() {
        var cause = $('#cause').val();
        var causeDate = getDateValue('causeDate');
        save('cause', cause, causeDate, -1);
    });
    $('#saveEffectButton').on('click', function() {
        var effect = $('#effect').val();
        var effectDate = getDateValue('effectDate');
        var severity = $('input[name=severity]:checked').val();
        save('effect', effect, effectDate, severity);
    });

    $('#buttonLogout').on('click', function() {
        gapi.auth2.getAuthInstance().signOut().then(function() {
            console.log('User signed out.');
            $('#buttonLogin').show();
            $('#buttonLogout').hide();
        });
    })

    $('#buttonLogin').on('click', function() {
        gapi.auth2.getAuthInstance().signIn().then(function() {
            console.log('User signed in.');
        });
    })

    $("#causeList").on("filterablefilter", function(event, ui) {
        ui.items.each(function(index, item) {
            $(item).not('.food-diary').each(function(index, item) {
                $(item).addClass('food-diary');
                $(item).on('click', function() {
                    $('#cause').val($(this).text());
                });
            });
        });
    });

    $("#effectList").on("filterablefilter", function(event, ui) {
        ui.items.each(function(index, item) {
            $(item).not('.food-diary').each(function(index, item) {
                $(item).addClass('food-diary');
                $(item).on('click', function() {
                    $('#effect').val($(this).text());
                });
            });
        });
    });
}
