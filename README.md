# WaveTweet Studio

A lightweight web app to:

- Paste an X/Twitter tweet URL
- Fetch tweet text and media
- Add your own design (headline, caption, background)
- Export a designed card image
- Download tweet media when available

## Run

1. Open a terminal in this folder.
2. Start the app:

```bash
node server.js
```

3. Open:

```text
http://localhost:5173
```

## Notes

- This app uses the `api.vxtwitter.com` source to fetch tweet metadata via the local server route `/api/tweet`.
- If a tweet is private, deleted, geo-restricted, or source behavior changes, loading may fail.
- Respect X/Twitter terms, content ownership, and local laws before downloading/reusing content.
