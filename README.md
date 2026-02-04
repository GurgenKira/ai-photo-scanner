# AI Photo Scanner (Mobile + Cloud Backend)

This project uses:
- Expo Snack frontend
- Pipedream backend (cloud function)
- Google Gemini Vision API

The app sends a base64 image to the backend. The backend returns:
- caption
- objects
- OCR text
- language

## Structure
- frontend/App.js — mobile app
- backend/pipedream-backend.js — cloud backend (runs on Pipedream)

## How to run
1. Open frontend/App.js inside Snack.
2. Enter your Pipedream endpoint URL in the app input field.
3. Pick or take a photo.
4. See AI result.

## Backend deployment
1. Create a Pipedream workflow with HTTP trigger.
2. Add a Node.js code step.
3. Paste `backend/pipedream-backend.js`.
4. Add secret: GEMINI_API_KEY
5. Deploy