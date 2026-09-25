# KPSTI Project Monitoring System (`kpsti-project-monitoring`)

Executive Project Monitoring Dashboard & AI Assistant for **Kementerian Pendidikan, Sains, Teknologi dan Inovasi Sabah (KPSTI)**.

Built with **React 19**, **Vite 6**, **Tailwind CSS v4**, **Firebase Firestore**, and **Gemini AI / Discovery Engine**.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Renaming Local Directory (Optional)

If you'd like your local folder name to match the project name `kpsti-project-monitoring`:

```powershell
cd ..
Rename-Item -Path "remix-kpsti-project-monitoring-dashboard" -NewName "kpsti-project-monitoring"
cd kpsti-project-monitoring
```

---

## 🐙 Push to GitHub

1. Initialize Git repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for KPSTI project monitoring"
   ```

2. Create a new repository on [GitHub](https://github.com/new) named `kpsti-project-monitoring`.

3. Link your remote repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/kpsti-project-monitoring.git
   git push -u origin main
   ```

---

## 🌐 Deploy to Netlify

This project is fully configured for continuous deployment on **Netlify** with Netlify Functions for serverless API handling (`/api/*`).

### Step-by-Step Deployment:
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to your `kpsti-project-monitoring` repository.
4. Netlify will automatically detect configuration from `netlify.toml`:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Functions Directory**: `netlify/functions`
5. Go to **Site Settings > Environment Variables** and add your production credentials:
   - `GEMINI_API_KEY`
   - `oauth_client_id`, `oauth_client_secret`, `oauth_refresh_token` (if using Discovery Engine agent)
   - `PROJECT_NUMBER`, `ENGINE_ID`, `ASSISTANT_ID`, `AGENT_ID` (if using Discovery Engine agent)
6. Click **Deploy Site**. Netlify will build the frontend and deploy the Netlify Serverless API Functions automatically.

---

## 🛠 Project Structure

```
kpsti-project-monitoring/
├── netlify/
│   └── functions/
│       └── api.ts          # Netlify Serverless Function adapter
├── public/                  # Static assets & applet blueprints
├── src/
│   ├── app.ts              # Core UI state & dashboard logic
│   ├── firebase.ts         # Firebase Auth & Firestore connection
│   ├── serverApp.ts        # Express API routes (/api/extract-document, /api/agent/stream)
│   ├── App.tsx             # React Root Component
│   └── main.tsx            # Vite Entrypoint
├── .env.example            # Environment variables template
├── index.html              # Main HTML entrypoint
├── netlify.toml            # Netlify deployment configuration
├── package.json            # Project dependencies & scripts
├── server.ts               # Local dev & production Express server
└── vite.config.ts          # Vite configuration
```
