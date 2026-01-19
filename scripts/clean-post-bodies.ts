import fs from 'fs';
import xml2js from 'xml2js';
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

// Function to clean content - keep only Hindi text, spaces, and punctuation
function cleanContent(content: string): string {
  // Remove WordPress-specific formatting
  let cleanContent = content
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')  // Remove CDATA tags
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')     // Remove WordPress block comments
    .replace(/--\s*wp:[^>]*\s*-->/g, '')       // Remove WordPress block markers
    .replace(/<[^>]*>/g, ' ')                  // Remove HTML tags
    .replace(/\[\/?caption[^\]]*\]/g, '')      // Remove caption tags
    .replace(/\[\/?embed[^\]]*\]/g, '')        // Remove embed tags
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim();

  // Extract only Hindi characters, spaces, and common punctuation
  // This regex keeps Hindi Unicode range, English letters (for names/abbreviations), numbers, and punctuation
  const hindiOnlyRegex = /[\u0900-\u097F\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E।,!?;:\-"'"()।]+/g;
  const matches = cleanContent.match(hindiOnlyRegex);
  
  if (matches) {
    return matches.join('').replace(/\s+/g, ' ').trim();
  }
  
  return cleanContent;
}

// Function to create a Sanity block
function createSanityBlock(text: string): any {
  return {
    _key: Math.random().toString(36).substring(7),
    _type: 'block',
    children: [
      {
        _key: Math.random().toString(36).substring(7),
        _type: 'span',
        marks: [],
        text: text
      }
    ],
    markDefs: [],
    style: 'normal'
  };
}

// Function to convert content to Sanity blocks
function contentToSanityBlocks(rawContent: string): any[] {
  const cleanedContent = cleanContent(rawContent);
  
  // Split by sentence endings or newlines to create separate blocks
  const sentences = cleanedContent
    .split(/([।!?।\n\r]+)/)
    .filter(sentence => sentence.trim() !== '')
    .map(sentence => sentence.trim());
  
  const blocks = [];
  
  for (const sentence of sentences) {
    // Skip if it's just punctuation
    if (sentence.match(/^[\s।!?।\n\r,;:-]+$/)) {
      continue;
    }
    
    // Skip if it's too short (likely noise)
    if (sentence.length < 3) {
      continue;
    }
    
    blocks.push(createSanityBlock(sentence));
  }
  
  // If no blocks were created, create at least one with the full content
  if (blocks.length === 0 && cleanedContent) {
    blocks.push(createSanityBlock(cleanedContent));
  }
  
  return blocks;
}

async function updateAllPosts() {
  try {
    console.log('Fetching all posts from Sanity...');
    
    // Fetch all posts
    const posts = await client.fetch('*[_type == "post"]');
    
    console.log(`Found ${posts.length} posts to update.`);
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`Processing post ${i + 1}/${posts.length}: ${post.title}`);
      
      // Since we don't have the original content, we'll just clean the existing body
      // In a real scenario, we'd have the original content to re-process
      // For now, we'll just log what we would do
      console.log(`  Post ${post.title} would be updated with cleaned content`);
    }
    
    console.log('Completed processing all posts.');
  } catch (error) {
    console.error('Error updating posts:', error);
  }
}

// Function to process and update a single post
async function updateSinglePost(postId: string, rawContent: string) {
  try {
    const body = contentToSanityBlocks(rawContent);
    
    await client.patch(postId).set({ body }).commit();
    console.log(`Successfully updated post with ID: ${postId}`);
  } catch (error) {
    console.error(`Error updating post ${postId}:`, error);
  }
}

// Main function to get all posts and update their content
async function main() {
  try {
    console.log('Starting mass update of post bodies...');
    
    // Fetch all posts
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        "originalContent": coalesce(body[0].children[0].text, "")
      }
    `);
    
    console.log(`Found ${posts.length} posts to update.`);
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`Updating post ${i + 1}/${posts.length}: ${post.title}`);
      
      // We need to get the original content from somewhere
      // Since we don't have it in the current posts, we'll need to re-parse the XML
      // For now, let's just log what would happen
    }
    
    console.log('Mass update completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Function to reprocess all content from the original XML
async function reprocessFromXML() {
  try {
    console.log('Reprocessing all content from original XML...');
    
    // Read the XML file
    const fs = require('fs');
    const xml2js = require('xml2js');
    
    const xmlData = fs.readFileSync('bihaanbhojpuri.WordPress.xml', 'utf8');
    
    const items: Array<any> = await new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, (err: Error | null, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items: Array<any> = result.rss.channel[0].item || [];
        resolve(items);
      });
    });
    
    console.log(`Found ${items.length} items in XML file.`);
    
    // Create a mapping of titles to content
    const contentMap: Record<string, string> = {};
    
    for (const item of items) {
      if (item['wp:post_type'] && item['wp:post_type'][0] !== 'post') {
        continue;
      }
      
      if (item['wp:status'] && item['wp:status'][0] !== 'publish') {
        continue;
      }
      
      const title = item.title?.[0]?.replace(/[<!\[CDATA\[]|]]>/g, '') || '';
      const content = item['content:encoded']?.[0]?.replace(/[<!\[CDATA\[]|]]>/g, '') || '';
      
      if (title.trim() && content.trim()) {
        contentMap[title] = content;
      }
    }
    
    console.log(`Mapped ${Object.keys(contentMap).length} titles to content.`);
    
    // Fetch all posts from Sanity
    const sanityPosts = await client.fetch('*[_type == "post"]{ _id, title }');
    
    console.log(`Found ${sanityPosts.length} posts in Sanity.`);
    
    // Define titles to exclude
    const excludedTitles = ['Untitled', 'Beyond the Obstacle', 'The Art of Connection', 'he rt of onnection'];

    // Update each post with cleaned content
    for (const sanityPost of sanityPosts) {
      // Skip excluded titles
      if (excludedTitles.some(excluded => sanityPost.title.includes(excluded))) {
        console.log(`Skipping excluded post: ${sanityPost.title}`);

        // Optionally delete the post if it shouldn't exist
        // await client.delete(sanityPost._id);
        // console.log(`  Deleted post: ${sanityPost.title}`);

        continue;
      }

      const originalContent = contentMap[sanityPost.title];

      if (originalContent) {
        console.log(`Updating post: ${sanityPost.title}`);

        // Clean the content
        const body = contentToSanityBlocks(originalContent);

        // Update the post
        await client
          .patch(sanityPost._id)
          .set({ body })
          .commit();

        console.log(`  Successfully updated body for: ${sanityPost.title}`);
      } else {
        console.log(`  Warning: No original content found for: ${sanityPost.title}`);
      }
    }
    
    console.log('Reprocessing from XML completed!');
  } catch (error) {
    console.error('Error in reprocessing:', error);
  }
}

reprocessFromXML();