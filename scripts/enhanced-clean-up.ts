import { createClient } from 'next-sanity';
import fs from 'fs';
import xml2js from 'xml2js';
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local file

// Create a client with the loaded environment variables
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // Needed for write operations
});

// Enhanced function to clean content - keep only Hindi text, spaces, and punctuation
function cleanContent(content: string): string {
  // Remove WordPress-specific formatting and problematic artifacts
  let cleanContent = content
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')  // Remove CDATA tags
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')     // Remove WordPress block comments
    .replace(/--\s*wp:[^>]*\s*-->/g, '')       // Remove WordPress block markers
    .replace(/<[^>]*>/g, ' ')                  // Remove HTML tags
    .replace(/\[\/?caption[^\]]*\]/g, '')      // Remove caption tags
    .replace(/\[\/?embed[^\]]*\]/g, '')        // Remove embed tags
    .replace(/>\/\s*--\s*:?\s*>\s*--\s*\/?:?>/g, '') // Remove problematic combinations like /> -- /: --> >:
    .replace(/\/\s*--\s*:?\s*>/g, '')          // Remove -- /: -->
    .replace(/>:\s*>/g, '')                    // Remove >:
    .replace(/\/>/g, '')                       // Remove />
    .replace(/\s*--\s*/g, ' ')                 // Remove standalone -- with spaces
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

// Function to reprocess all content from the original XML
async function reprocessFromXML() {
  try {
    console.log('Enhanced cleaning of all post bodies...');
    
    // Fetch all posts from Sanity
    const sanityPosts = await client.fetch('*[_type == "post"]{ _id, title }');
    
    console.log(`Found ${sanityPosts.length} posts to enhance clean.`);
    
    // Define titles to exclude
    const excludedTitles = ['Untitled', 'Beyond the Obstacle', 'The Art of Connection', 'he rt of onnection'];

    // Update each post with enhanced cleaned content
    for (const sanityPost of sanityPosts) {
      // Skip excluded titles
      if (excludedTitles.some(excluded => sanityPost.title.includes(excluded))) {
        console.log(`Skipping excluded post: ${sanityPost.title}`);
        continue;
      }
      
      console.log(`Enhancing cleaning for post: ${sanityPost.title}`);
      
      // Get the current body to clean it further
      const currentPost = await client.fetch(`*[_type == "post" && _id == $id][0]`, { id: sanityPost._id });
      
      if (currentPost && currentPost.body && currentPost.body.length > 0) {
        // Extract text from current body
        let currentText = '';
        for (const block of currentPost.body) {
          if (block._type === 'block' && block.children) {
            for (const child of block.children) {
              if (child._type === 'span' && child.text) {
                currentText += child.text + ' ';
              }
            }
          }
        }
        
        if (currentText.trim()) {
          const cleanedBody = contentToSanityBlocks(currentText);
          await client
            .patch(sanityPost._id)
            .set({ body: cleanedBody })
            .commit();
            
          console.log(`  Enhanced cleaned body for: ${sanityPost.title}`);
        }
      }
    }
    
    console.log('Enhanced cleaning completed!');
  } catch (error) {
    console.error('Error in enhanced cleaning:', error);
  }
}

reprocessFromXML();