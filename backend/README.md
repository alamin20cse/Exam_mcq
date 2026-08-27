# MCQ Exam Backend

## Setup
1. `cd backend`
2. `npm install`
3. Get your Firebase service account key:
   - Firebase Console → Project Settings → Service Accounts → "Generate new private key"
   - Save the downloaded file as `serviceAccountKey.json` in this `backend/` folder
   (or base64-encode it and put it in `.env` as `FB_SERVICE_KEY`)
4. `.env` is already filled in with your Mongo credentials. Update `CLIENT_URL` for production.
5. `npm run dev` (uses nodemon) or `npm start`

Server runs on https://exammcq-mu.vercel.app
