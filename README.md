# Hearthlight 家燈

Hearthlight is a small family story book for the web. A person signs in with email and a password, chooses how often a question should be offered, and picks which question to answer from a large bank. They can type or speak. The recording is stored, not only the transcript. Photographs come from the phone or computer in their hand. Before anyone prints or shares a story, they can read it back as a page: the words, the chosen type, and the pictures together.

The product owner is in Hong Kong. People using it may be in Hong Kong, mainland China, or elsewhere. Nothing required for sign-in, questions, writing, dictation, photos, or the gift card depends on Google, Firebase, YouTube, Google Fonts, or reCAPTCHA.

## What you can do

- Create an account and sign in with email and a password.
- Choose English, Simplified Chinese, or Traditional Chinese. The choice is saved. A new visitor starts from the browser language: `zh-CN` becomes Simplified, `zh-HK` / `zh-TW` becomes Traditional.
- Walk through a short setup: what to be called, a place in the family, where they grew up, work, people, hobbies, topics they like, and topics to leave alone. Every part after language can be skipped. The same answers can be edited later in Settings.
- Suggested questions use that profile. A question can name a place or a person they mentioned. Skipped topics stay hidden until they ask to see them. They still choose the question. Nothing is assigned as the only prompt.
- Keep a memory for a child. Answer a prompt about their life — first steps, a birthday, school, a family outing — or start a blank page. Those memories can be browsed by theme, by the child's years, and by place, in the same way as the life questions.
- Open the family memoir. It is a collected book: a title page, a table of contents, and chapters by time of life, by theme, or by person (your own stories, and a chapter for each child). Each story keeps its words and photographs. Print it or save a PDF from the browser. No outside print service is used.
- Set the invitation pace: weekly, twice a week, monthly, or every N days. They can write on any day.
- Write in a book-like page. Change the font (book serif or clear sans), size, alignment, spacing, first-line indent, and a large first letter. Bold, italic, and underline are there for a phrase.
- Record speech in the browser. The audio file is saved on the account. A pluggable transcriber turns it into text they can edit. The default transcriber is Whisper running on this server, not the Chrome / Google speech service. Traditional Chinese transcripts are converted with OpenCC toward Hong Kong usage after recognition.
- Add photographs from the device. JPEG, PNG, WebP, and GIF. There is no Google Photos step.
- Read the story log, open a compiled preview, and print or save that preview as PDF from the browser.
- Download a printable A6 birthday gift card (PNG or PDF) whose QR code opens the sign-up page. The address comes from `PUBLIC_BASE_URL`.

## Local setup

You need Node.js 22.

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

`npm run setup` creates the SQLite database and loads the sample family. Run it again only if you want to confirm the database shape. It will not wipe stories that are already there. To replace the sample accounts:

```bash
npm run seed:reset
```

### Sample accounts

Both passwords are `lantern-demo`.

| Email | Who | What you will see |
| --- | --- | --- |
| `mei@hearthlight.local` | 陳美玲, a grandmother in Hong Kong | Traditional Chinese, a question ready now, four stories with pictures |
| `lin@hearthlight.local` | 林伟, a father in Shenzhen | Simplified Chinese, the next invitation still in the future, two stories |

The sign-in page can enter either account for you. Their stories are not visible to each other.

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 43123 |
| `npm run build` and `npm start` | Production build, same port |
| `npm run check` | Confirms the question bank has 100+ items in all three languages |
| `npm run gift-card:sample` | Rewrites the sample cards in `docs/samples/` |
| `npm run lint` | ESLint |

Sample gift cards, using the placeholder address `https://stories.example.com/sign-up`, are already in `docs/samples/`:

- `gift-card-zh-Hant.png` and `.pdf` — the Hong Kong card
- `gift-card-zh-Hans.png` and `.pdf`
- `gift-card-en.png` and `.pdf`

## Architecture

```
Browser
  email/password session (httpOnly cookie, HS256 JWT)
  MediaRecorder → 16 kHz WAV
  device photo upload
        │
        ▼
Next.js (this repository)
  pages and route handlers
  Prisma → SQLite file at data/hearthlight.db
  object storage → data/uploads, or S3-compatible OSS / COS
  speech → local Whisper (transformers.js) or your HTTP endpoint
```

Text and metadata live in the database: accounts, the profile used to order questions, stories, formatting, captions, and the transcript. Audio and photographs live in object storage. The database only keeps the storage key, type, and size.

### Accounts

Passwords are hashed with bcrypt. The session cookie is `httpOnly` and `SameSite=Lax`. There is no third-party login. Email and password are the primary path, and the only path in this version.

### Questions and profile

The bank is `lib/questions/bank.ts`: 135 questions, each written in English, Simplified Chinese, and Traditional Chinese. Traditional wording follows written Chinese used in Hong Kong where the everyday word differs (薪金, 街市, 電郵, 農曆新年, 爺爺嫲嫲 / 公公婆婆), not a mechanical character swap of the Simplified line.

On the question page the bank can be browsed three ways, in all three languages. By theme, questions are grouped and can sit in more than one category: childhood, family, school, career (the old “work” label), self-development, marriage, children, food, traditions, migration, later life, and the rest of the themes. By time, each question has a life stage and the groups run from family beginnings through childhood, school, coming of age, career, marriage, and children, then later life, with a last group for memories that run across a life. By place, only the questions about a place are shown, gathered as hometown, home, a city or region, moving, or travel. Nothing in that grouping is a private address. Suggested questions still sit above the groups.

`/children` is the parents' shelf. Its prompts are a smaller bank about a child, with the same three ways of browsing. A blank page needs the child's name plus a theme, a time of life, and a place, and it is stored as a story with no question. `/book` compiles every story into a memoir: title page, contents, chapter openings, then the stories and their photographs. Chapters can follow time of life, theme, or person.

A few questions contain placeholders such as `{childhoodPlace}` or `{person}`. If that part of the profile is empty, the fallback sentence is used. `lib/questions/personalize.ts` hides a question whose main theme was opted out of, and lifts questions that match what they said they enjoy, their place in the family, and any detail that can be filled in.

### Speech to text

Recording does not use the Web Speech API.

1. The browser records, decodes the clip, and uploads a 16 kHz mono WAV.
2. The server stores that file immediately.
3. A second request transcribes it.

`STT_PROVIDER`:

- `transformers` (default). `@xenova/transformers` runs `Xenova/whisper-base` on the server. The model cache is `data/models`. The first transcription downloads the model and can take a few minutes. The recording is already saved before that starts.
- `http`. POST the WAV to `STT_HTTP_URL`.
  - `STT_HTTP_FORMAT=json` sends the raw WAV and an `X-Language` header (`zh` or `en`). The response is `{ "text": "..." }`. Optional `Authorization: Bearer STT_HTTP_KEY`.
  - `STT_HTTP_FORMAT=openai` sends multipart form data in the shape used by self-hosted Whisper servers (`file`, `model`, `language`). Point this at a service you run. Do not point it at a public API that is unreliable from mainland China.
- `none`. Keep the recording and skip transcription. The person types, or listens and writes.

For Traditional Chinese, recognized text is passed through OpenCC from Simplified to Hong Kong Traditional. They can always edit the words. The audio file remains the recording they made.

If Hugging Face is hard to reach while seeding the model, set `HF_ENDPOINT=https://hf-mirror.com` or copy a prepared `data/models` directory onto the server. In production, a faster-whisper process on the same private network, or Alibaba Cloud Intelligent Speech / Tencent Cloud ASR behind the HTTP adapter, will be kinder on long recordings than Whisper-base in Node. The interface stays the same.

### Photographs

Upload is from the device. The server checks the file signature, allows JPEG, PNG, WebP, and GIF, and rejects anything else. Files are private: `/api/media/...` only serves them to the signed-in owner. A Google Photos picker is not included. It is blocked or unreliable in mainland China, so it is not offered as a step anyone can get stuck on.

### Fonts

The interface loads Source Serif 4, Source Sans 3, Noto Serif SC, Noto Serif TC, Noto Sans SC, and Noto Sans TC from packages in this app. The browser requests them from your server. Gift cards are drawn with Liberation Serif and Droid Sans Fallback, vendored under `assets/fonts/` so a small cloud image does not need a font CDN. Licenses are in `assets/fonts/NOTICE.md`.

### Gift card

`PUBLIC_BASE_URL` is the origin encoded in the QR code, plus `/sign-up`. Set it to the real `https` address before printing cards for a birthday. Until then, the gift page says the code still points at a sample or local address. Signed-in people download a PNG or an A6 PDF from **Settings → Birthday gift card**. Generation uses `@resvg/resvg-js` and `pdf-lib` on the server. No outside QR service is called.

### Language

UI strings live in `lib/i18n/en.ts`, `zh-Hans.ts`, and `zh-Hant.ts`. Dates use `en-GB`, `zh-CN`, or `zh-HK`. A signed-in person's saved language wins over the browser. Guests keep an `hl_locale` cookie.

## Configuration

Copy `.env.example` to `.env`.

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | SQLite file. The path is relative to `prisma/schema.prisma`. |
| `SESSION_SECRET` | At least 16 characters. Change it before anyone else can reach the server. |
| `PUBLIC_BASE_URL` | Origin for the gift-card QR code, without a trailing slash. |
| `STORAGE_DRIVER` | `local` or `s3`. |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3-compatible object storage. |
| `S3_FORCE_PATH_STYLE` | `false` for Aliyun OSS and Tencent COS virtual-host addresses. `true` for some MinIO setups. |
| `STT_PROVIDER`, `STT_MODEL`, `STT_HTTP_URL`, `STT_HTTP_FORMAT`, `STT_HTTP_KEY`, `HF_ENDPOINT` | Speech, described above. |

Local files:

- `data/hearthlight.db` — stories and accounts
- `data/uploads/` — audio and photographs
- `data/models/` — Whisper cache

Back up the database file and the upload directory together. A story row without its audio object is an incomplete story.

The schema uses plain strings and dates, so it can move to PostgreSQL. Change the datasource provider to `postgresql`, set `DATABASE_URL` to Aliyun RDS or TencentDB, and run `npx prisma db push`. Do that before real traffic if more than one app process will write at once. SQLite is appropriate for local development and for a single Node process serving one family.

## Deployment

Run the app as a normal Node server behind HTTPS. A small virtual machine in the right region matters more than a specialized frontend host.

```bash
npm ci
npm run setup
npm run build
npm start
```

Put Nginx, Caddy, or the cloud load balancer in front, with a certificate. Keep `SESSION_SECRET` and the storage keys out of the image. Persist `data/` if you stay on SQLite and local disk, or move uploads to object storage and the database to a managed Postgres instance. Restart with systemd or the cloud VM's process supervisor.

Object storage examples:

- Alibaba Cloud OSS, Hong Kong: endpoint `https://oss-cn-hongkong.aliyuncs.com`, region `oss-cn-hongkong`, `S3_FORCE_PATH_STYLE=false`.
- Tencent Cloud COS, Hong Kong: endpoint `https://cos.ap-hongkong.myqcloud.com`, region `ap-hongkong`, same path-style flag.

Create the bucket as private. The app reads objects with the server keys and sends them only to the signed-in owner. Do not turn on a public bucket URL for family recordings.

### Where to put it

**(a) Default: Alibaba Cloud or Tencent Cloud in Hong Kong.**

Use ECS (Aliyun) or CVM (Tencent) in Hong Kong, plus their object storage in the same region. Hong Kong does not require ICP filing (备案). Latency into mainland China is generally usable, and the same origin is reachable from Hong Kong and from overseas without the filtering that hits many foreign application hosts. This is the right default for a family that spans Hong Kong, the mainland, and relatives abroad, especially when nobody is ready to file ICP.

**(b) Mainland region, if most people are there and filing is realistic.**

A mainland region of Aliyun or Tencent, with OSS or COS in that region, is the fastest path for relatives on ordinary mainland networks. A public website on a mainland server needs ICP 备案, and the filing has to be completed before the site is opened to the public. Choose this when the owner can finish that process and almost everyone reading the stories is in the mainland. Otherwise stay in Hong Kong.

**(c) Do not use Vercel, Netlify, or Firebase as the only production home.**

Those hosts are built around networks and, in Firebase's case, Google services that are often slow, inconsistent, or blocked from mainland China. A deploy that works on a laptop in Hong Kong can fail for a parent in Guangzhou: the page, the font request, the login call, or the audio upload never completes. Firebase also pulls the product toward Google sign-in and Google-hosted storage, which this app deliberately does not require. They are a poor sole production target for this family. A Hong Kong or mainland origin, with your own object storage, is the setup that matches where people actually are.

Speech in production should be the local Whisper cache, a Whisper process on the same VPC, or Alibaba / Tencent speech behind `STT_PROVIDER=http`. Do not send family recordings to a speech API that the mainland network cannot reach.

## Privacy, briefly

Each account sees only its own stories. There is no public feed. Deleting a story removes its text, its photographs, and its recording. The gift card does not contain a story. It only points at sign-up.
