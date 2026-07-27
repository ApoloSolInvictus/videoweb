# Video Web

Private Venice AI creator for **The Secret Books**. It is ready for Vercel and keeps the Venice API key server-side.

## Venice model choices

Current Venice model research favored:

- Images: `chroma`, `z-image-turbo`, and `venice-sd35` at about `$0.01` per generation. The app defaults to `chroma`.
- Videos: `longcat-distilled-text-to-video` for maximum duration per credit. A 30s 720p quote returned about `$0.53`.
- Cinematic/private clips: `grok-imagine-*-private`, useful for photorealistic work with audio and private download flow.

The UI includes PNG/JPG image downloads, a video quote button before queueing, and automatic polling until Venice returns the final video.

## Environment

Set these in Vercel Project Settings:

```bash
VENICE_API_KEY=...
APP_PASSWORD=...
AUTH_SECRET=...
```

`APP_PASSWORD` protects the creator. `AUTH_SECRET` signs the login cookie.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Vercel will detect Next.js automatically:

```bash
npm run build
```
