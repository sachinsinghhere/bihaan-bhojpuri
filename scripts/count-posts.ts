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

async function countPosts() {
  try {
    // Fetch all posts
    const posts = await client.fetch('*[_type == "post"]');
    console.log('Total posts in Sanity:', posts.length);
    
    // Also get counts by category
    const poems = await client.fetch('*[_type == "post" && category == "poems"]');
    const stories = await client.fetch('*[_type == "post" && category == "stories"]');
    
    console.log('Poems:', poems.length);
    console.log('Stories:', stories.length);
  } catch (error) {
    console.error('Error counting posts:', error);
  }
}

countPosts();