# Video Asset Setup

The hero video (`hero-video.mp4`) is not included in the repository due to file size. 

## Setup Instructions

1. Place your video file in the `public` directory
2. Name it `hero-video.mp4`
3. The video will be displayed in a circular mask on the landing page and chat widget

## Video Requirements

- Format: MP4
- Recommended size: Under 5MB for optimal loading
- The video will be cropped and zoomed (200% scale) focusing on the left-center area

## Alternative: Use a placeholder

If you don't have the video file, you can replace the video elements with a static image or gradient in:
- `/src/app/page.tsx` (hero section)
- `/src/components/ChatWidget.tsx` (chat avatar)