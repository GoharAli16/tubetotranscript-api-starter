# TubeToTranscript API Starter

A minimal Node.js example that calls the [TubeToTranscript API](https://www.tubetotranscript.com/youtube-transcript-api) and renders an available YouTube transcript in the browser.

The API key stays on the server. Do not place an API key in front-end JavaScript, a public repository, or client-side environment variables.

## Run locally

1. Install Node.js 18 or later.
2. Clone this repository and enter the folder.
3. Copy `.env.example` to `.env`.
4. Optionally add `TUBETOTRANSCRIPT_API_KEY` to `.env` for your account's API rate limit. Requests work without a key at the public rate limit.
5. Start the project:

   ```bash
   npm start
   ```

6. Open [http://localhost:3001](http://localhost:3001).

## How it works

The browser sends a YouTube URL to this project's `/api/transcript` endpoint. The Node server validates the host, calls:

```text
GET https://www.tubetotranscript.com/api/v1/transcript?url=YOUTUBE_URL
```

and returns the JSON response to the page.

## API response shape

```json
{
  "language": "en",
  "metadata": {
    "title": "Example video",
    "channel": "Example channel"
  },
  "transcript": [
    { "text": "Welcome", "start": 0, "duration": 1.2 }
  ]
}
```

## Next steps

- Add language selection with the API's `language` parameter.
- Export the returned transcript as TXT, SRT, or VTT.
- Deploy to a Node-compatible host and configure `TUBETOTRANSCRIPT_API_KEY` as a server-side environment variable.

## License

MIT
