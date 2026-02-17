# Feedback Mail Generator

Minimal, polished UI for creating structured feedback emails fast. Built with React, Vite, Tailwind CSS v4, and shadcn-style base components. Includes client‑side sentiment analysis shown on the right side of the form.

## Features
- Multiple feedback formats: Interview, Mock Interview, Resume Understanding, Assessment
- Clean, minimal UI with light gray + light purple + blue palette
- Shadcn-style inputs (Button, Select, Input, Textarea, Label)
- Client-side sentiment analysis of the feedback text
- Output format is preserved exactly as specified
- Copy rich text or plain markdown with one click

## Getting Started
1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. Build for production:
   ```
   npm run build
   ```
4. Lint:
   ```
   npm run lint
   ```

## How to Use
1. Choose a format from the switcher at the top.
2. Fill in the required fields.
3. Click “Generate Feedback”.
4. The formatted output appears below the form. Use “Copy Output” to copy.
5. Sentiment analysis for the “Feedback” text appears on the right side of the form.

## Notes on Output Format
- The output formatting logic is centralized in [App.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/App.jsx#L264-L299) and remains unchanged.
- You can paste the output directly into an email or document editor.

## UI and Styling
- Tailwind CSS v4 is used for utility styling.
- Palette emphasizes light gray, soft purple, and blue accents.
- Shadcn-style base components live in:
  - [button.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/components/ui/button.jsx)
  - [select.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/components/ui/select.jsx)
  - [input.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/components/ui/input.jsx)
  - [textarea.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/components/ui/textarea.jsx)
  - [label.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/components/ui/label.jsx)

## Key Files
- App and layout: [App.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/App.jsx)
- Sentiment UI: [SentimentDisplay.jsx](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/SentimentDisplay.jsx)
- Sentiment logic: [sentimentAnalyzer.js](file:///c:/Users/Vizva/Documents/Projects/WEB/Feedback_mail_generator/src/sentimentAnalyzer.js)

## License
MIT © Your Organization
