/* global gapi */
/* global Bind */
/* global $ */

var VERSION = '0.0.4';
var CLIENT_ID = '712538785806-i0jv11s6pas34nd8i9b5vudum8m1e9vg.apps.googleusercontent.com';
var docId = '';
var weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var MINUTE_INCREMENT = 30 * 60 * 1000;
var currentLocation = { 'latitude': 'unknown', 'longitude': 'unknown', 'altitude': 'unknown' };

var model = Bind({
    version: VERSION
}, {
    'version': '.version'
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
    data.push('\'' + string);
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
    }, function(reason) {
        console.error('error: ' + reason.result.error.message);
    });
}

function pushGeo(data) {
    data.push(currentLocation.latitude ? currentLocation.latitude : 'unknown');
    data.push(currentLocation.longitude ? currentLocation.longitude : 'unknown');
    data.push(currentLocation.altitude ? currentLocation.altitude : 'unknown');
}

function findOrCreateDocId() {
    console.log('searching');
    gapi.client.drive.files.list({
        q: "name='tracie-tracker-data'",
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
            console.log('not found - creating');
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
                    docId = response.result.spreadsheetId;
                    console.log('Created: ' + JSON.stringify(response))
                    gapi.client.sheets.spreadsheets.batchUpdate({
                        spreadsheetId: docId,
                        resource: {
                            requests: [{
                                updateSpreadsheetProperties: {
                                    properties: {
                                        title: "tracie-tracker-data"
                                    },
                                    fields: 'title'
                                }
                            }]
                        }
                    }).then((response) => {
                        console.log('Title set: ' + JSON.stringify(response.result));
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

                        gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody).then(function(response) {
                            console.log('Inserted: ' + JSON.stringify(response.result));
                        }, function(reason) {
                            console.error('error: ' + reason.result.error.message);
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

                        gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody).then(function(response) {
                            console.log('Inserted: ' + JSON.stringify(response.result));
                        }, function(reason) {
                            console.error('error: ' + reason.result.error.message);
                        });
                    });
                },
                function(reason) {
                    console.error('Could not create: ' + reason.result.error.message);
                });
        }
    });
}

function initClient() {
    console.log('init client');
    var SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
    gapi.client.init({
        'clientId': CLIENT_ID,
        'scope': SCOPE,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4', "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    }).then(function() {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}


function updateSignInStatus(isSignedIn) {
    if (isSignedIn) {
        findOrCreateDocId();
        setupUi();
        getLocation();
    }
    else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

function getUniqueValues() {
    var params = {
        spreadsheetId: docId,
        range: 'Unique!A2:B',
        majorDimension: 'COLUMNS'
    };
    
    var request = gapi.client.sheets.spreadsheets.values.get(params);
    request.then(function(response) {
        var causes = response.result.values[0];
        var effects = response.result.values[1];
        var htmlCause = '';
        for (var cause of causes) {
            htmlCause += "<li>" + cause + "</li>"; 
        }
        var htmlEffect = '';
        for (var effect of effects) {
            htmlEffect += "<li>" + effect + "</li>";
        }
        $('#causeList').html(htmlCause);
        $('#causeList').listview("refresh");
        $('#causeList').trigger("updatelayout");
        $('#effectList').html(htmlEffect);
        $('#effectList').listview("refresh");
        $('#effectList').trigger("updatelayout");
    }, function(reason) {
        console.error('error: ' + reason.result.error.message);
    });
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
