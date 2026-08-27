const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FB_SERVICE_KEY) {
    // Deployment: base64 encoded JSON stored in env var
    const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
} else {
    // Local dev: file placed next to this file
    // Download it from Firebase Console > Project Settings > Service Accounts
    try {
        serviceAccount = require('./serviceAccountKey.json');
    } catch (err) {
        console.error(
            '\n[firebaseAdmin] Missing Firebase credentials.\n' +
            'Either place a serviceAccountKey.json file in the backend folder,\n' +
            'or set FB_SERVICE_KEY (base64 of that json) in your .env file.\n'
        );
        process.exit(1);
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
