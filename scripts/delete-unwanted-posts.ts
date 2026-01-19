import { createClient } from 'next-sanity';
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local file

// Create a client with the loaded environment variables
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // Needed for write operations
});

async function deleteUnwantedPosts() {
  try {
    console.log('Deleting unwanted posts...');
    
    // Define titles to exclude
    const excludedTitles = ['Untitled', 'Beyond the Obstacle', 'The Art of Connection', 'he rt of onnection'];
    
    // Fetch posts that match excluded titles
    for (const title of excludedTitles) {
      const postsToDelete = await client.fetch(
        `*[_type == "post" && title match $title]{ _id, title }`,
        { title: `${title}*` } // Using match to find posts that contain the title
      );
      
      console.log(`Found ${postsToDelete.length} posts to delete for title pattern: ${title}`);
      
      for (const post of postsToDelete) {
        console.log(`Deleting post: ${post.title} (ID: ${post._id})`);
        await client.delete(post._id);
        console.log(`  Successfully deleted: ${post.title}`);
      }
    }
    
    console.log('Deletion process completed!');
  } catch (error) {
    console.error('Error deleting posts:', error);
  }
}

deleteUnwantedPosts();