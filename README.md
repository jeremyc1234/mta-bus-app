# My MTA Bus App

A **Next.js** application that displays real-time bus arrivals near a specific location (Union Square, NYC by default). It features a **carousel of grey tiles** (one per stop), horizontal scrolling, and a countdown timer for automatic refreshes. On **mobile** devices, tiles snap into place; on **desktop**, you can freely scroll. It also shows basic occupancy info if provided by the MTA feed.

## Features

1. **Union Square** as Default Location  
   - The app uses approximate coordinates for Union Square: `lat=40.7359` / `lon=-73.9906`.  
   - You can change them in `app/page.tsx`.

2. **Real-Time Bus Data**  
   - Fetches bus stops and arrivals using the MTA’s **SIRI** APIs.  
   - Shows how many stops away each bus is, plus an approximate arrival time.

3. **Mobile vs. Desktop Behavior**  
   - **Mobile**: “Tiles” snap horizontally (carousel style).  
   - **Desktop**: You can freely scroll horizontally.  

4. **Customized UI**  
   - Grey tiles filling the viewport height (`100vh`).  
   - Automatic refresh every 30 seconds with a countdown.  
   - Renders up to **5** closest stops, sorted by distance.  
   - If a bus is “0 stops away,” it shows “<1 Stop Away.”  
   - Some simple text like “Other bus routes will appear here if available” if only one route is found.  

## Requirements

- **Node.js** (v14+ recommended)  
- **npm** or **yarn**  

## Environment Variables

You’ll need an **MTA** API key. In Next.js, you typically set it in `.env.local`:

```
MTA_API_KEY=YOUR-REAL-MTA-KEY-HERE
```

No other environment variables are strictly required for this setup, but if you integrate **Redis** or other services, set them accordingly (e.g. `REDIS_URL`).

## Setup & Installation

1. **Clone** the repository:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/my-mta-app.git
   cd my-mta-app
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn
   ```

3. **Create** a `.env.local` file to store your MTA API key:
   ```bash
   echo "MTA_API_KEY=YOUR-KEY" > .env.local
   ```

4. **Run** the development server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser.  
   - If you’re on mobile, you’ll see tiles snap.  
   - On desktop, you can horizontally scroll freely.

## Usage

- The app fetches data from the MTA’s **SIRI** API endpoints (specifically `stops-for-location.json` and `stop-monitoring.json`).  
- Every **30 seconds**, it re-fetches automatically.  
- You can see a **countdown** at the top next to the “Updated:” label.  
- The page displays up to **5** stops near the lat/lon you set. Each tile shows route cards.  
- **If a route has buses**: You’ll see how many stops away, approximate arrival time, and if `Occupancy` is present, it appears.  
- **If a route or stop has no arrivals**: “No buses en-route to this stop.”

## Changing the Location

1. Open **`app/page.tsx`**.  
2. Look for:
   ```js
   const FIXED_LAT = 40.7359;
   const FIXED_LON = -73.9906;
   ```
3. Replace them with **your** desired coordinates.  
4. Restart the dev server (`ctrl + c`, then `npm run dev`) to pick up changes.

## Deployment

### Deploy to Vercel

1. **Push** your code to GitHub.  
2. **Create** a new project on [Vercel](https://vercel.com/).  
3. **Import** your GitHub repo.  
4. In **Vercel Project Settings → Environment Variables**, set:
   ```
   MTA_API_KEY=YOUR-REAL-MTA-KEY
   ```
5. **Deploy**. The site will build and be hosted on a `.vercel.app` domain.

### Deploy Elsewhere

- You can deploy to any Node.js environment that can run Next.js (e.g., DigitalOcean, AWS).  
- Make sure to set **`MTA_API_KEY`** in that environment’s config or `.env` equivalent.

## Contributing

1. **Fork** this repo.  
2. **Create** a feature branch for your changes (`git checkout -b feature/something`).  
3. **Commit** your changes (`git commit -m "Add new feature"`).  
4. **Push** to GitHub (`git push`).  
5. Open a **Pull Request** describing your changes.

## License

You can choose an open-source license you prefer (e.g., MIT, Apache). This is just a placeholder:

```
MIT License
Copyright (c) 2023 Jeremy
Permission is hereby granted, free of charge, to any person obtaining a copy ...
```

## Acknowledgments

- **MTA** for providing the BusTime API.  
- **Next.js** for powering the front end.  

---

*Happy coding!* If you have any questions, feel free to open an issue or PR.
