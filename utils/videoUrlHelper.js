/**
 * Video URL Helper Utility
 * Handles video URL validation and processing for different platforms
 */

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
];

// Social media video URL patterns
const SOCIAL_PATTERNS = [
  /^https?:\/\/(www\.)?facebook\.com\/.*\/videos\/\d+/,
  /^https?:\/\/(www\.)?instagram\.com\/p\/[\w-]+\//,
  /^https?:\/\/(www\.)?tiktok\.com\/@[\w-]+\/video\/\d+/,
  /^https?:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/,
  /^https?:\/\/(www\.)?x\.com\/\w+\/status\/\d+/
];

/**
 * Validate if a URL is a valid video URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid video URL
 */
const isValidVideoUrl = (url) => {
  if (!url) return false;
  
  const isValidYouTube = YOUTUBE_PATTERNS.some(pattern => pattern.test(url));
  const isValidSocial = SOCIAL_PATTERNS.some(pattern => pattern.test(url));
  
  return isValidYouTube || isValidSocial;
};

/**
 * Extract video ID from URL
 * @param {string} url - The video URL
 * @returns {string|null} - The video ID or null if not found
 */
const extractVideoId = (url) => {
  if (!url) return null;
  
  // YouTube patterns
  const youtubeWatchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  const youtubeShortMatch = url.match(/youtu\.be\/([\w-]+)/);
  const youtubeEmbedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
  
  if (youtubeWatchMatch) return youtubeWatchMatch[1];
  if (youtubeShortMatch) return youtubeShortMatch[1];
  if (youtubeEmbedMatch) return youtubeEmbedMatch[1];
  
  // Social media patterns
  const facebookMatch = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  const instagramMatch = url.match(/instagram\.com\/p\/([\w-]+)/);
  const tiktokMatch = url.match(/tiktok\.com\/@[\w-]+\/video\/(\d+)/);
  const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  
  if (facebookMatch) return facebookMatch[1];
  if (instagramMatch) return instagramMatch[1];
  if (tiktokMatch) return tiktokMatch[1];
  if (twitterMatch) return twitterMatch[1];
  
  return null;
};

/**
 * Get video platform type
 * @param {string} url - The video URL
 * @returns {string|null} - The platform name or null if unknown
 */
const getVideoPlatform = (url) => {
  if (!url) return null;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('facebook.com')) {
    return 'facebook';
  } else if (url.includes('instagram.com')) {
    return 'instagram';
  } else if (url.includes('tiktok.com')) {
    return 'tiktok';
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'twitter';
  }
  
  return 'unknown';
};

/**
 * Get embed URL for video
 * @param {string} url - The original video URL
 * @returns {string|null} - The embed URL or null if not supported
 */
const getEmbedUrl = (url) => {
  if (!url) return null;
  
  const videoId = extractVideoId(url);
  const platform = getVideoPlatform(url);
  
  if (!videoId) return null;
  
  switch (platform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${videoId}`;
    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&height=315`;
    case 'instagram':
      return `https://www.instagram.com/p/${videoId}/embed/`;
    case 'tiktok':
      return `https://www.tiktok.com/@username/video/${videoId}`;
    case 'twitter':
      return `https://platform.twitter.com/widgets/tweet.html?id=${videoId}`;
    default:
      return url;
  }
};

/**
 * Get thumbnail URL for video
 * @param {string} url - The video URL
 * @returns {string|null} - The thumbnail URL or null if not available
 */
const getThumbnailUrl = (url) => {
  if (!url) return null;
  
  const videoId = extractVideoId(url);
  const platform = getVideoPlatform(url);
  
  if (!videoId) return null;
  
  switch (platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'facebook':
      // Facebook doesn't provide direct thumbnail URLs
      return null;
    case 'instagram':
      // Instagram doesn't provide direct thumbnail URLs
      return null;
    case 'tiktok':
      // TikTok doesn't provide direct thumbnail URLs
      return null;
    case 'twitter':
      // Twitter doesn't provide direct thumbnail URLs
      return null;
    default:
      return null;
  }
};

/**
 * Normalize video URL to standard format
 * @param {string} url - The video URL
 * @returns {string|null} - The normalized URL or null if invalid
 */
const normalizeVideoUrl = (url) => {
  if (!url) return null;
  
  if (!isValidVideoUrl(url)) {
    return null;
  }
  
  const platform = getVideoPlatform(url);
  
  switch (platform) {
    case 'youtube':
      // Convert short URLs to standard format
      if (url.includes('youtu.be/')) {
        const videoId = extractVideoId(url);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
      return url;
    case 'facebook':
    case 'instagram':
    case 'tiktok':
    case 'twitter':
      return url;
    default:
      return null;
  }
};

module.exports = {
  isValidVideoUrl,
  extractVideoId,
  getVideoPlatform,
  getEmbedUrl,
  getThumbnailUrl,
  normalizeVideoUrl,
  YOUTUBE_PATTERNS,
  SOCIAL_PATTERNS
};
