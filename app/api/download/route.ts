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
    console.error('TikTok download error:', error)
    return NextResponse.json(
      { error: 'Failed to download TikTok video' },
      { status: 500 }
    )
  }
} 