# TikTok Video Downloader

A web application to download and preview TikTok videos without watermark.

## Features
- Download TikTok videos without watermark
- Preview video before downloading
- Download history with timestamps
- Responsive design for mobile and desktop
- iOS and Android support

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- RapidAPI for TikTok video extraction

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/video-downloader.git
cd video-downloader
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file and add your RapidAPI key:
```env
RAPID_API_KEY=your_rapidapi_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## API Configuration
1. Subscribe to [TikTok Video Downloader API](https://rapidapi.com/developer/authorization/default-application_10197242) on RapidAPI
2. Get your API key
3. Add it to `.env.local`

## Deployment
1. Deploy to Vercel:
   - Connect your GitHub repository
   - Add RAPID_API_KEY to environment variables
   - Deploy

## Known Issues
- iOS Safari requires different download handling
- Some TikTok videos may require authentication

## License
MIT

# Introduction

# How it was built


```