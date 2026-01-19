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

// Function to update all posts with new schema fields
async function updatePostsSchema() {
  try {
    console.log('Updating posts schema...');
    
    // Fetch all posts from Sanity
    const sanityPosts = await client.fetch('*[_type == "post"]{ _id, title, category }');
    
    console.log(`Found ${sanityPosts.length} posts to update.`);
    
    // Update each post with new schema fields
    for (const sanityPost of sanityPosts) {
      console.log(`Updating post: ${sanityPost.title}`);
      
      // Prepare the update transaction
      const transaction = client.transaction();
      
      // Set the new fields with default values
      transaction.patch(sanityPost._id, patch => 
        patch.set({
          featured: false,
          pinned: false,
          likes: 0
        })
        // Unset the old category field
        .unset(['category'])
      );
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`  Updated post: ${sanityPost.title}`);
    }
    
    console.log('Schema update completed!');
  } catch (error) {
    console.error('Error updating posts schema:', error);
  }
}

updatePostsSchema();