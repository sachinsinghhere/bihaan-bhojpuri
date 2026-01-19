import { createClient } from 'next-sanity';
require('dotenv').config({ path: '.env.local' });

// Create a client with the loaded environment variables
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
});

async function testConnection() {
  console.log('Testing Sanity connection...');
  console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
  console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
  
  try {
    // Test basic connection by fetching a count
    const count = await client.fetch('count(*[_type == "post"])');
    console.log('Total posts in Sanity:', count);
    
    // Fetch first 3 posts to verify data exists
    const posts = await client.fetch('*[_type == "post"] | order(publishedAt desc)[0...3] {_id, title, slug}');
    console.log('First 3 posts:');
    posts.forEach((post, i) => {
      console.log(`  ${i+1}. ${post.title} (slug: ${post.slug?.current})`);
    });
    
    // Test pagination manually
    console.log('\nTesting pagination manually...');
    const allPosts = await client.fetch('*[_type == "post"] | order(publishedAt desc) {_id, title, slug, publishedAt}');
    console.log(`Total fetched posts: ${allPosts.length}`);
    
    // Slice manually to simulate pagination
    const page1 = allPosts.slice(0, 3);
    const page2 = allPosts.slice(3, 6);
    const page3 = allPosts.slice(6, 9);
    
    console.log('\nPage 1 (posts 0-2):');
    page1.forEach((post, i) => console.log(`  ${i+1}. ${post.title}`));
    
    console.log('\nPage 2 (posts 3-5):');
    page2.forEach((post, i) => console.log(`  ${i+1}. ${post.title}`));
    
    console.log('\nPage 3 (posts 6-8):');
    page3.forEach((post, i) => console.log(`  ${i+1}. ${post.title}`));
    
  } catch (error) {
    console.error('Error testing connection:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();