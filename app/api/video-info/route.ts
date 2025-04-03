import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    
    if (!body?.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const isTwitterUrl = body.url.includes('x.com') || body.url.includes('twitter.com');
    
    if (isTwitterUrl) {
      const options = {
        method: 'POST',
        url: 'https://all-video-downloader1.p.rapidapi.com/all',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Key': process.env.RAPID_API_KEY,
          'X-RapidAPI-Host': 'all-video-downloader1.p.rapidapi.com'
        },
        data: new URLSearchParams({
          url: body.url
        }).toString()
      };

      const { data: result } = await axios.request(options);
      
      // Check for audio-only format
      let audioUrl = null;
      let highestBitrate = 0;
      
      // Check if formats array exists and has items
      if (result.formats && Array.isArray(result.formats)) {
        // First look for direct MP4 audio files (not m3u8)
        for (const format of result.formats) {
          if (
            format.resolution === 'audio only' && 
            format.url && 
            format.abr && 
            !format.url.includes('.m3u8') &&
            format.abr > highestBitrate
          ) {
            highestBitrate = format.abr;
            audioUrl = format.url;
            console.log("Found direct MP4 audio:", format);
          }
        }
        
        // If no direct MP4 found, then use m3u8 as fallback
        if (!audioUrl) {
          for (const format of result.formats) {
            if (
              format.resolution === 'audio only' && 
              format.url && 
              format.abr && 
              format.abr > highestBitrate
            ) {
              highestBitrate = format.abr;
              audioUrl = format.url;
            }
          }
        }
      }

      return NextResponse.json({
        musicUrl: audioUrl,
        musicFilename: audioUrl ? `audio-${Date.now()}.mp3` : null
      });
    } else {
      // TikTok handling
      const apiProvider = body.apiProvider || "primary";
      
      if (apiProvider === "primary") {
        const options = {
          method: 'GET',
          url: 'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index',
          params: { url: body.url },
          headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
          }
        };

        const { data: result } = await axios.request(options);
        
        // Extract music URL if available
        const musicUrl = result.music && Array.isArray(result.music) && result.music.length > 0 
          ? result.music[0] 
          : (result.music || null);
          
        return NextResponse.json({
          musicUrl: musicUrl,
          musicFilename: musicUrl ? `tiktok-audio-${Date.now()}.mp3` : null
        });
      } else {
        // For secondary provider, no audio info
        return NextResponse.json({
          musicUrl: null,
          musicFilename: null
        });
      }
    }
  } catch (error) {
    console.error('Video info error:', error);
    return NextResponse.json(
      { error: 'Failed to get video info' },
      { status: 500 }
    );
  }
} 