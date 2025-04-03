/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    if (!process.env.RAPID_API_KEY) {
      console.error('RAPID_API_KEY is not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}))
    
    if (!body?.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Get the selected API provider (default to "primary")
    const apiProvider = body.apiProvider || "primary";

    // Check if it's an X.com/Twitter URL
    const isTwitterUrl = body.url.includes('x.com') || body.url.includes('twitter.com');
    
    const filename = body.filename || `video-${Date.now()}.mp4`;
    
    if (isTwitterUrl) {
      // TODO: Replace with a more reliable Twitter API provider
      // For now, maintain existing functionality
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
      
      // Note: With the current API, we don't support audio download for Twitter
      // A future implementation with a better API could restore this functionality
      
      if (body.direct) {
        // For mobile direct download
        const videoResponse = await axios.get(result.url, {
          responseType: 'arraybuffer'
        });
        
        const headers = new Headers();
        headers.set('Content-Type', 'video/mp4');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        
        return new NextResponse(videoResponse.data, {
          status: 200,
          headers
        });
      } else {
        return NextResponse.json({
          url: result.url,
          filename,
          musicUrl: null, // No audio for Twitter videos with this provider
          musicFilename: null
        });
      }
    } else {
      // TikTok handling with API provider selection
      if (apiProvider === "primary") {
        // New primary API endpoint
        const options = {
          method: 'GET',
          url: 'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index',
          params: { url: body.url },
          headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
          }
        }

        const { data: result } = await axios.request(options)
        
        // Log the response for debugging
        console.log('New API Response:', JSON.stringify(result, null, 2));
        
        // Check if the API returned a valid result
        if (!result?.video) {
          throw new Error('Could not extract video URL from primary API');
        }

        // Extract video URL, handling both array and string formats
        const videoUrl = Array.isArray(result.video) ? result.video[0] : result.video;

        // Extract music URL if available
        const musicUrl = result.music && Array.isArray(result.music) && result.music.length > 0 
          ? result.music[0] 
          : (result.music || null);

        // For non-mobile platforms, return both URLs if available
        if (!body.direct) {
          return NextResponse.json({
            url: videoUrl,
            musicUrl: musicUrl,
            filename: `tiktok-${Date.now()}.mp4`,
            musicFilename: musicUrl ? `tiktok-audio-${Date.now()}.mp3` : null
          });
        }

        // For direct download (mobile), continue with current implementation
        // since we're returning the video data directly
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer'
        });

        const headers = new Headers();
        headers.set('Content-Type', 'video/mp4');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);

        return new NextResponse(videoResponse.data, {
          status: 200,
          headers,
        });
      } else {
        // Existing/secondary TikTok API
        const options = {
          method: 'GET',
          url: 'https://tiktok-video-no-watermark2.p.rapidapi.com/',
          params: { url: body.url },
          headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
          }
        }

        const { data: result } = await axios.request(options)
        
        if (!result?.data?.play) {
          throw new Error('Could not extract video URL from secondary API')
        }

        // For iOS, fetch the video and return it directly
        if (body.direct) {
          const videoResponse = await axios.get(result.data.play, {
            responseType: 'arraybuffer'
          });

          const headers = new Headers();
          headers.set('Content-Type', 'video/mp4');
          headers.set('Content-Disposition', `attachment; filename="${filename}"`);

          return new NextResponse(videoResponse.data, {
            status: 200,
            headers,
          });
        }

        // For other platforms, return the URL
        return NextResponse.json({
          url: result.data.play,
          filename: `tiktok-${Date.now()}.mp4`
        });
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}

// Separate function for fallback TikTok download
async function handleFallbackTikTokDownload(body) {
  const options = {
    method: 'GET',
    url: 'https://tiktok-video-no-watermark2.p.rapidapi.com/',
    params: { url: body.url },
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
    }
  }

  const { data: result } = await axios.request(options)
  
  if (!result?.data?.play) {
    throw new Error('Could not extract video URL from fallback API')
  }

  // For iOS, fetch the video and return it directly
  if (body.direct) {
    const videoResponse = await axios.get(result.data.play, {
      responseType: 'arraybuffer'
    });

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(videoResponse.data, {
      status: 200,
      headers,
    });
  }

  // For other platforms, return the URL
  return NextResponse.json({
    url: result.data.play,
    filename: `tiktok-${Date.now()}.mp4`
  });
} 