# Education to Employment Pipeline Dashboard

Preliminary React dashboard project for the uploaded enrollment and graduate
employment Excel files.

## Start the project

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Data

Workbook assets are staged under `public/data` so the React app can fetch them
from `/data/<workbook-name>.xlsx` during the dashboard implementation phase.

JSON exports are generated under `public/data/json`. Each workbook gets its own
folder with one JSON file per sheet plus `metadata.json`.

```powershell
python scripts/convert_excel_to_json.py
```

The app manifest in `src/data/workbooks.js` points to these generated JSON files
for dashboard development.
