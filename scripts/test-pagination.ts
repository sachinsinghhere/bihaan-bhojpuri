require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local file
import { getPosts } from '../src/lib/sanity';

async function testPagination() {
  console.log('Testing pagination...');

  // Get first page
  const page1 = await getPosts(1, 3);
  console.log(`Page 1 (${page1.length} posts):`);
  page1.forEach((post, idx) => console.log(`  ${idx + 1}. ${post.title.substring(0, 50)}...`));

  // Get second page
  const page2 = await getPosts(2, 3);
  console.log(`\nPage 2 (${page2.length} posts):`);
  page2.forEach((post, idx) => console.log(`  ${idx + 1}. ${post.title.substring(0, 50)}...`));

  // Get third page
  const page3 = await getPosts(3, 3);
  console.log(`\nPage 3 (${page3.length} posts):`);
  page3.forEach((post, idx) => console.log(`  ${idx + 1}. ${post.title.substring(0, 50)}...`));
}

testPagination();