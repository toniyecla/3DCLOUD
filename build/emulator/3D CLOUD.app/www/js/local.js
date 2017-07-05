/* moment-precise-range */

var STRINGS = {
    nodiff: '',
    year: 'año',
    years: 'años',
    month: 'mes',
    months: 'meses',
    day: 'día',
    days: 'días',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
    delimiter: ' '
};

function pluralize(num, word) {
    return num + ' ' + STRINGS[word + (num === 1 ? '' : 's')];
}

function buildStringFromValues(yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff){
    var result = [];

    if (yDiff) {
        result.push(pluralize(yDiff, 'year'));
    }
    if (mDiff) {
        result.push(pluralize(mDiff, 'month'));
    }
    if (dDiff) {
        result.push(pluralize(dDiff, 'day'));
    }
    if (hourDiff) {
        result.push(pluralize(hourDiff, 'hour'));
    }
    if (minDiff) {
        result.push(pluralize(minDiff, 'minute'));
    }
    if (secDiff) {
        result.push(pluralize(secDiff, 'second'));
    }

    return result.join(STRINGS.delimiter);
}

function preciseDiff(d1, d2, returnValueObject) {
    var m1 = moment(d1), m2 = moment(d2), firstDateWasLater;

    m1.add(m2.utcOffset() - m1.utcOffset(), 'minutes'); // shift timezone of m1 to m2

    if (m1.isSame(m2)) {
        return STRINGS.nodiff;
    }
    if (m1.isAfter(m2)) {
        var tmp = m1;
        m1 = m2;
        m2 = tmp;
        firstDateWasLater = true;
    } else {
        firstDateWasLater = false;
    }

    var yDiff = m2.year() - m1.year();
    var mDiff = m2.month() - m1.month();
    var dDiff = m2.date() - m1.date();
    var hourDiff = m2.hour() - m1.hour();
    var minDiff = m2.minute() - m1.minute();
    var secDiff = m2.second() - m1.second();

    if (secDiff < 0) {
        secDiff = 60 + secDiff;
        minDiff--;
    }
    if (minDiff < 0) {
        minDiff = 60 + minDiff;
        hourDiff--;
    }
    if (hourDiff < 0) {
        hourDiff = 24 + hourDiff;
        dDiff--;
    }
    if (dDiff < 0) {
        var daysInLastFullMonth = moment(m2.year() + '-' + (m2.month() + 1), "YYYY-MM").subtract(1, 'M').daysInMonth();
        if (daysInLastFullMonth < m1.date()) { // 31/01 -> 2/03
            dDiff = daysInLastFullMonth + dDiff + (m1.date() - daysInLastFullMonth);
        } else {
            dDiff = daysInLastFullMonth + dDiff;
        }
        mDiff--;
    }
    if (mDiff < 0) {
        mDiff = 12 + mDiff;
        yDiff--;
    }

    if (returnValueObject) {
        return {
            "years": yDiff,
            "months": mDiff,
            "days": dDiff,
            "hours": hourDiff,
            "minutes": minDiff,
            "seconds": secDiff,
            "firstDateWasLater": firstDateWasLater
        };
    } else {
        return buildStringFromValues(yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff);
    }
}

/* formato dd/mm/yyyy */

function fecha(d1) {
    var m1 = moment(d1);

    return m1.format('DD/MM/YYYY');
}

function fechahora(d1) {
    var m1 = moment(d1);

    return m1.format('DD/MM/YYYY HH:mm');
}

/* share whatsapp */

function shareWhatsApp() {
    window.plugins.socialsharing.shareViaWhatsApp(
        'Mensaje desde aplicación móvil: ',
        null /* img */,
        null /* url */,
        function() {},
        function(errormsg){
            console.log(errormsg);
        }
    );
}

/* app */

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onBackButton, true);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        // db = window.openDatabase("Database", "1.0", "simFAMA", 16 * 1024);
        init();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /*
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        */

        console.log('Received Event: ' + id);
    },
    onBackButton: function() {
        app.receivedEvent('backbutton');
        back();
    }
};

/* database functions */

var db;
var db_user = "";
var db_password = "";

function dbStoreLogin() {
    db.transaction(dbStoreLoginTransaction, dbError, dbStoreSuccess);
}

function dbStoreLoginTransaction(tx) {
    dbDropTable(tx);
    dbCheckTable(tx);
    tx.executeSql('INSERT INTO USERS (user, password) VALUES (?, ?)', [db_user, db_password]);
}

function dbStoreSuccess() {
    console.log("dbStoreLogin success");
}

function dbCheckLogin() {
    db.transaction(dbCheckLoginTransaction);
}

function dbCheckLoginTransaction(tx) {
    dbCheckTable(tx);
    tx.executeSql('SELECT * FROM USERS', [], dbCheckSuccess, dbError);
}

function dbCheckSuccess(tx, results) {
    console.log("dbCheckLogin success");

    if (results.rows.length > 0) {
        db_user = results.rows.item(0).user;
        db_password = results.rows.item(0).password;
        autoLogin();
    }
}

function dbDestroyLogin() {
    db.transaction(dbDestroyLoginTransaction, dbError, dbDestroySuccess);
}

function dbDestroyLoginTransaction(tx) {
    db_user = "";
    db_password = "";
    dbDropTable(tx);
}

function dbDestroySuccess() {
    console.log("dbDestroySuccess success");
}

function dbDropTable(tx) {
    tx.executeSql('DROP TABLE IF EXISTS USERS');
}

function dbCheckTable(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS USERS (user unique, password)');
}

function dbError(err) {
    console.log("SQL error #" + err.code + ": " + +err.message);
}

/* init */

var native = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
if (native) {
    app.initialize();
} else {
    window.init();
}