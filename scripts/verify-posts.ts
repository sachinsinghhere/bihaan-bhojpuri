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

async function verifyPosts() {
  try {
    console.log('Verifying posts in Sanity...');
    
    // Fetch a few posts to check their structure
    const posts = await client.fetch('*[_type == "post"][0...5]{ _id, title, featured, pinned, likes }');
    
    console.log(`Found ${posts.length} posts to verify.`);
    
    if (posts.length > 0) {
      console.log('Sample posts:');
      posts.forEach(post => {
        console.log(`- ID: ${post._id}, Title: ${post.title.substring(0, 50)}..., Featured: ${post.featured}, Pinned: ${post.pinned}, Likes: ${post.likes}`);
      });
    } else {
      console.log('No posts found in Sanity.');
    }
    
    // Check if the new fields exist
    const samplePost = await client.fetch('*[_type == "post"][0]');
    
    if (samplePost) {
      console.log('\nSample post structure:');
      console.log(JSON.stringify(samplePost, null, 2));
    }
    
    // Check if there are any featured posts
    const featuredPosts = await client.fetch('*[_type == "post" && featured == true]');
    console.log(`\nFeatured posts: ${featuredPosts.length}`);
    
    // Check if there are any pinned posts
    const pinnedPosts = await client.fetch('*[_type == "post" && pinned == true]');
    console.log(`Pinned posts: ${pinnedPosts.length}`);
    
  } catch (error) {
    console.error('Error verifying posts:', error);
  }
}

verifyPosts();