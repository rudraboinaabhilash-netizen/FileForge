# FileForge

A fresh React + TypeScript + Vite file utility website with a premium Ocean Blue interface.

## Requirements
- Node.js 20 or newer
- npm

## Run on Windows
1. Install Node.js from https://nodejs.org/
2. Extract `FileForge.zip`.
3. Open the extracted `FileForge` folder.
4. In File Explorer, click the address bar, type `cmd`, and press Enter.
5. Run:

```bash
npm install
npm run dev
```

6. Open the local URL printed in the terminal (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Implemented tools
- Merge PDF
- Extract PDF pages
- Rotate PDF
- Pictures to PDF (JPG/PNG)
- Add PDF watermark
- Compress / resize / convert / rotate pictures
- ZIP creator and ZIP extractor (extractor outputs a ZIP bundle)
- SHA-256 file checker
- QR code generator
- Metadata viewer
- Password generator
- Text file merger
- Text comparison
- Basic length and weight unit conversion

The other tool cards are intentionally labelled **Coming soon** and open an explanation instead of showing fake processing results. AI background removal, OCR, barcode scanning and the remaining advanced PDF/image tools need additional implementation and testing before they should be advertised as ready.

## Privacy notes
- The listed implemented processing functions run in the browser.
- Files are not automatically uploaded by this application.
- Browser APIs and dependencies are used locally after the site is loaded.
- Do not treat client-side PDF password protection as implemented: it is not included.
- The PWA caches the application shell and same-origin resources after installation; first-time use and dependency downloads require an internet connection.

## Themes
Use the theme control in the top navigation to cycle between Ocean Blue, Violet and Light. The choice is stored in localStorage.

## Project layout

```text
FileForge/
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── services/
│   │   └── fileTools.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

## Notes
This is a new project, separate from the uploaded starter archive. The original archive is not modified. Review supported file formats and limits before deploying for public use.
