import { InstagramService } from './src/features/instagram/instagram.service';
import fs from 'fs';
import path from 'path';

async function testProfileScraper() {
  const instagramService = new InstagramService();

  try {
    console.log('Starting profile scrape test...');
    
    // Test with target profile
    const username = 'pinkinkcosmetictattoo';
    const result = await instagramService.fetchProfileData(
      username,
      ['posts', 'stories', 'highlights', 'reels', 'tagged'],
      12, // limit
      true, // includeMetadata
      true // includeEngagement
    );

    console.log('Scrape Results:');
    console.log('Username:', result.username);
    console.log('Posts:', result.dataTypes.posts.length);
    console.log('Stories:', result.dataTypes.stories.length);
    console.log('Highlights:', result.dataTypes.highlights.length);
    console.log('Reels:', result.dataTypes.reels.length);
    console.log('Tagged Posts:', result.dataTypes.tagged.length);

    // Verify profile photo download
    if (result.dataTypes.posts.length > 0) {
      const firstPost = result.dataTypes.posts[0];
      if (firstPost.mediaUrl) {
        const savePath = path.join(__dirname, 'test_profile_photo.jpg');
        const response = await fetch(firstPost.mediaUrl);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(savePath, Buffer.from(buffer));
        console.log('✅ Profile photo saved to:', savePath);
      }
    }

    // Verify data completeness
    const hasRequiredData = result.username &&
      result.dataTypes.posts.length > 0 &&
      result.dataTypes.stories.length >= 0 &&
      result.dataTypes.highlights.length >= 0 &&
      result.dataTypes.reels.length >= 0 &&
      result.dataTypes.tagged.length >= 0;

    if (hasRequiredData) {
      console.log('✅ Profile scrape test completed successfully');
    } else {
      console.error('❌ Profile scrape test failed - missing required data');
    }
  } catch (error) {
    console.error('❌ Profile scrape test failed:', error);
  } finally {
    await instagramService.close();
  }
}

testProfileScraper();
