# Prompt Library (React + Vite + TypeScript + MUI)

A minimal, clean prompt library application. Create, save, and manage prompts locally in your browser using localStorage.

## Features

-   Add prompts with title and content
-   Save to localStorage
-   View saved prompts as cards with title + short preview
-   Delete prompts (removes from localStorage)
-   Clean developer-themed UI using Material UI (dark mode)

## Run locally (Windows cmd)

```bat
:: Install dependencies
npm install

:: Start dev server
npm run dev

:: Build for production (optional)
npm run build

:: Preview the production build (optional)
npm run preview
```

## Project structure

-   `src/components/PromptForm.tsx` – Form for creating new prompts
-   `src/components/PromptCard.tsx` – Card showing saved prompt + delete action
-   `src/pages/Home.tsx` – Page composing the form and list
-   `src/utils/storage.ts` – localStorage helpers
-   `src/types.ts` – TypeScript types
-   `src/theme.ts` – MUI theme (developer dark style)
-   `src/App.tsx`, `src/main.tsx` – App entry

## Notes

-   Data is stored in your browser only (no backend).
-   This app aims to be minimal and focused—no extra features included.
