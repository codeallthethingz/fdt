/* global gapi */
/* global Bind */
/* global $ */

var VERSION = '0.0.3';
var CLIENT_ID = '712538785806-0lu2qefune22njdab1urosfhqvgsbh6j.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDWcwedLSnOvd_8govqhuMpSHZv5EEwLKw';
var docId = '';
var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MINUTE_INCREMENT = 30 * 60 * 1000;

var model = Bind({
    version: VERSION
}, {
    'version': '.version'
});


function doSomething() {

    var params = {
        spreadsheetId: docId,
        range: 'Sheet1!A1:Z1',
        valueInputOption: 'RAW'
    };

    var valueRangeBody = {
        "range": "Sheet1!A1:Z1",
        "majorDimension": "ROWS",
        "values": [
            ["wheels", "$15", "2", "3/15/2016"],
            ["mirrors", "$100", "1", "3/20/2016"],
        ],
    }

    var request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    request.then(function(response) {
        console.log('Inserted: ' + JSON.stringify(response.result));
    }, function(reason) {
        console.error('error: ' + reason.result.error.message);
    });
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
                break;
            }
        }
        else {
            console.log('not found - creating');
            gapi.client.sheets.spreadsheets.create().then(function(response) {
                    docId = response.result.spreadsheetId;
                    gapi.client.sheets.spreadsheets.batchUpdate({
                        spreadsheetId: response.result.spreadsheetId,
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
                        console.log('Created: ' + JSON.stringify(response.result));
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
        'apiKey': API_KEY,
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
    }
    else {
        gapi.auth2.getAuthInstance().signIn();
    }
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
