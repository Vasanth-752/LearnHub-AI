import { google } from 'googleapis'
import { env } from '../config/env.js'

const youtube = google.youtube({
  version: 'v3',
  auth: env.YOUTUBE_API_KEY,
})

export async function searchVideos(query, maxResults = 8) {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      order: 'relevance',
      videoEmbeddable: true,
      videoSyndicated: true,
      safeSearch: 'moderate',
    })

    return response.data.items?.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    })) || []
  } catch (error) {
    console.error('YouTube API error:', error)
    throw new Error('Failed to search videos')
  }
}

export async function getVideoDetails(videoIds) {
  try {
    const response = await youtube.videos.list({
      part: ['contentDetails', 'statistics'],
      id: videoIds.join(','),
    })

    return response.data.items?.map(item => ({
      id: item.id,
      duration: item.contentDetails?.duration,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
    })) || []
  } catch (error) {
    console.error('YouTube video details error:', error)
    return []
  }
}