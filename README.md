# my new tab
Its a custom new tab page with some Beat Saber stats. Built with HTML, CSS and JavaSript using Vite. Made for the Stardance challenge.

**Live site** https://kratak78.github.io/my-new-tab/

## Features
- Search bar
- time and date
- Customizable Shortcuts
- some Beatleader and ScoreSaber stats
- Settings panel

## Two ways to use it:
**Browser extension (recommended).** It replaces your new tab page, and search uses your default search engine.
1. Clone the repo and run `npm install`
2. Run `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and pick the `dist` folder. (this step might be different for other browsers)

**Website.** The hosted version works the same, except search always goes to google.

## How it works
- stats are fetched from BeatLeader and ScoreSaber APIs and cached in `localStorage` for 10 minutes
- In the extension, the APIs are called directly using host permissions
- On the website, requests go through a small Cloudflare Worker, because the BeatLeader and ScoreSaber APIs don't send CORS headers, so browsers block the page from reading their responses directly
- Your player ID and shortcuts are stored only in your browser

## Development
```
npm install
npm run dev
```

## Built with
HTML, CSS, JavaScript, Vite, GitHub Pages, and a Cloudflare Worker.
