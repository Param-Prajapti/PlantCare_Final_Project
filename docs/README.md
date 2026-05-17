# PlantCare Developer Manual

## Vercel Link
plant-care-final-project-89oi.vercel.app

## Disclaimer
This app is working with limited API calls and limited data

## Audience
This document is for future developers who will be taking over the PlantCare system.

---

## System Overview
PlantCare is a full-stack web application that helps users track and care for their indoor plants. It uses a React frontend, a Node.js/Express backend, and a Supabase (PostgreSQL) database. It integrates two external APIs: the Perenual Plant API for care data and the Pl@ntNet API for plant image identification.

---

## Tech Stack
- **Frontend:** React (Vite), Chart.js, React Toastify
- **Backend:** JavaScript (Node.js, Express)
- **Database:** Supabase (PostgreSQL)
- **External APIs:** Perenual Plant API, Pl@ntNet API
- **Deployment:** Vercel

---

## Installation

### Requirements
- Node.js v22.12 or higher
- npm
- Supabase account (free tier works)
- Perenual API key (free at perenual.com)
- Pl@ntNet API key (free at my.plantnet.org)

### Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/plantcare.git
cd plantcare
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Install Backend Dependencies
```bash
cd ../backend
npm install
```

### Set Up Environment Variables
Create a `.env` file inside the `/backend` folder

### Set Up Supabase Database
1. Go to supabase.com and create a new project
2. Create a table with the following columns:

| Column         | Type | Nullable |
|----------------|------|----------|
| id             | int8 | No  |
| user_plant_name| text | Yes |
| species_name   | text | Yes |
| last_watered   | text | Yes |
| image_url      | text | Yes |
| perenual_id    | int8 | Yes |
| care_level     | text | Yes |

3. Disable Row Level Security (RLS) on the table
4. Copy your Project URL and anon public key into your `.env` file

### Files containing app code

- plantcare/
- backend/
- index.js
- frontend/
- src/
- pages/
- About.jsx
- Home.jsx
- Search.jsx
- App.css
- App.jsx
- main.jsx
- docs/
- README.md


---

## Running the Application

### Start the Backend Server
```bash
cd backend
node index.js
```
The backend will run at `http://localhost:3000`

### Start the Frontend
Open a new terminal:
```bash
cd frontend
npm run dev
```
The frontend will run at `http://localhost:5173`
Both servers must be running at the same time for the app to work.

---

## Running Tests
Once you run the app, you can manually test it:

1. Go to `http://localhost:3000/api/plants` to verify the database connection
2. Go to `http://localhost:3000/api/search?name=aloe` to verify the Perenual API connection
3. Go to `http://localhost:3000/api/search/details/1` to verify care data is returned
4. Using Insomnia to test API endpoints

---

## API Endpoints

### Plants (Database)

#### GET /api/plants
Returns all plants saved in the database.

Example: 
**Response:**
```json
[
  {
    "id": 3,
    "user_plant_name": "Aloe",
    "species_name": "Aloe vera",
    "last_watered": "2026-05-15",
    "image_url": "",
    "perenual_id": 15,
    "care_level": "Easy"
  }
]
```

#### POST /api/plants
Adds a new plant to the database.

**Request Body:**
```json
{
  "user_plant_name": "Aloe",
  "species_name": "Aloe vera",
  "last_watered": "2026-05-15",
  "image_url": "",
  "perenual_id": 15,
  "care_level": "Easy"
}
```

**Response:**
```json
{
  "message": "Plant added",
  "plant": { ...plant object... }
}
```

#### PATCH /api/plants/:id
Updates the last watered date for a specific plant.

**Request Body:**
```json
{
  "last_watered": "2026-05-17"
}
```

**Response:**
```json
{
  "message": "Updated",
  "plant": { ...updated plant object... }
}
```

---

### Search (Perenual API)

#### GET /api/search?name={plantName}
Searches for plants by name using the Perenual API.

**Example:** `/api/search?name=aloe`

**Response:** Returns a list of matching plant species with id, common name, and scientific name.

#### GET /api/search/details/:id
Returns full care details for a specific plant by its Perenual ID.

**Example:** `/api/search/details/15`

**Response:** Returns watering frequency, sunlight requirements, care level, and other care data.

---

### Identify (Pl@ntNet API)

#### POST /api/identify
Accepts a base64 encoded plant image and returns the top 3 species matches.

**Request Body:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "matches": [
    {
      "species": "Monstera deliciosa",
      "commonNames": ["Swiss cheese plant"],
      "score": 85
    }
  ]
}
```

---

## Known Bugs - IMPORTANT INFO REGARDING API LIMITS

1. **API Limits** — The free API plan allows only 100 requests per day. If the limit is hit, search and care data will stop loading until the limit resets.

2. **LIMITED CARE DATA** — The Perenual free plan only provides full care data for plants with IDs under 3000. Plants with higher IDs will show an error message.

3. **Pl@ntNet Speed** — The Pl@ntNet API can take 10-30 seconds to return results depending on server load.

4. **Image URL Storage** — When a user uploads a photo for identification, the image is stored as a temporary browser object URL. This URL does not persist after the browser session ends, so plant cards will show a placeholder emoji instead of the photo on subsequent visits.

---

## Future Development Roadmap

1. **User Authentication** — Add Supabase Auth so each user has their own plant collection. Currently all users share the same database.

2. **Image Storage** — Integrate Supabase Storage to store user-uploaded plant photos permanently.

3. **Watering Reminders** — Add push notifications or email reminders when a plant is due for watering based on its frequency and last watered date.

4. **Upgrade Perenual Plan** — Upgrading to a paid Perenual plan would unlock care data for all plant species and remove the daily request limit.

5. **Offline Support** — Have plant data locally so the app shows user's plants without an internet connection.