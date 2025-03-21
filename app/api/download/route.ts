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

    // Check if it's an X.com/Twitter URL
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
      
      // Log the response for debugging
      console.log('API Response:', JSON.stringify(result, null, 2));

      if (!result?.url) {
        throw new Error('Could not extract video URL');
      }

      const videoUrl = result.url;

      // Handle direct download for mobile
      if (body.direct) {
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer'
        });

        const headers = new Headers();
        headers.set('Content-Type', 'video/mp4');
        headers.set('Content-Disposition', `attachment; filename="${body.filename || `video-${Date.now()}.mp4`}"`);

        return new NextResponse(videoResponse.data, {
          status: 200,
          headers,
        });
      }

      return NextResponse.json({
        url: videoUrl,
        filename: `video-${Date.now()}.mp4`
      });
    }

    // Existing TikTok handling
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
      throw new Error('Could not extract video URL')
    }

    // For iOS, fetch the video and return it directly
    if (body.direct) {
      const videoResponse = await axios.get(result.data.play, {
        responseType: 'arraybuffer'
      });

      const headers = new Headers();
      headers.set('Content-Type', 'video/mp4');
      headers.set('Content-Disposition', `attachment; filename="${body.filename || `tiktok-${Date.now()}.mp4`}"`);

      return new NextResponse(videoResponse.data, {
        status: 200,
        headers,
      });
    }

    // For other platforms, return the URL
    return NextResponse.json({
      url: result.data.play,
      filename: `tiktok-${Date.now()}.mp4`
    })
  } catch (error) {
    console.error('Video download error:', error)
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    )
  }
} 