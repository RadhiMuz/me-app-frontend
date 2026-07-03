# Factory Apps — Unified Project

## Setup

```
npm install
npm run dev
```

Runs on http://localhost:5175 (or your network IP)

## What changed from the 4-app setup

- ONE React app instead of 3 separate Vite projects (homepage, pm-checksheet, spare-parts)
- React Router handles navigation — /, /reports, /checksheet, /spareparts, /machines
- ONE npm run dev command, ONE port
- TopNav + UserModal are now shared components used everywhere
- Backend (appsheet-backend) is UNCHANGED — still runs separately on port 8000

## IMPORTANT — checklist images

You need to copy your checklist images into:
  public/checklist-images/

These were referenced in checklistData.js as /checklist-images/1_1.jpg etc.
Copy them from your old pm-checksheet/public/checklist-images/ folder.

## Folder structure

src/
├── App.jsx                 ← router setup, top-level auth check
├── main.jsx
├── api/
│   ├── checksheetApi.js
│   └── sparePartsApi.js
├── components/
│   ├── TopNav.jsx
│   └── UserModal.jsx
└── pages/
    ├── LoginPage.jsx
    ├── HomePage.jsx
    ├── ReportPage.jsx
    ├── MachinePage.jsx
    ├── ChecksheetPage.jsx
    ├── SparePartsPage.jsx
    ├── checklistData.js
    ├── machineData.js
    ├── reportLocationData.js
    └── downtimeData.js

