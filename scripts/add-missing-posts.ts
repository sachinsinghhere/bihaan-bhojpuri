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

// Function to clean content - remove all specified symbols
function cleanContent(content: string): string {
  // Remove all specified symbols and combinations
  let cleanContent = content
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')  // Remove CDATA tags
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')     // Remove WordPress block comments
    .replace(/--\s*wp:[^>]*\s*-->/g, '')       // Remove WordPress block markers
    .replace(/<[^>]*>/g, ' ')                  // Remove HTML tags
    .replace(/\[\/?caption[^\]]*\]/g, '')      // Remove caption tags
    .replace(/\[\/?embed[^\]]*\]/g, '')        // Remove embed tags
    // Remove all specified symbols and combinations
    .replace(/&;/g, '')                        // Remove &;
    .replace(/="/g, '')                        // Remove ="
    .replace(/-">/g, '')                       // Remove -">
    .replace(/":\/\//g, '')                    // Remove "://
    .replace(/\.\.\/-/g, '')                   // Remove ../-
    .replace(/\/\//g, '/')                     // Remove // (double slash to single)
    .replace(/___/g, ' ')                      // Remove ___ (triple underscore)
    .replace(/=""/g, '')                       // Remove =""
    .replace(/=" "/g, '')                      // Remove ="
    .replace(/>/g, '')                         // Remove >
    .replace(/"/g, '')                         // Remove "
    .replace(/=/g, '')                         // Remove =
    .replace(/&/g, '')                         // Remove &
    .replace(/;/g, '')                         // Remove ;
    .replace(/-/g, '')                         // Remove -
    .replace(/\./g, '')                        // Remove .
    .replace(/\//g, '')                        // Remove /
    .replace(/_/g, '')                         // Remove _
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim();

  // Extract only Hindi characters, spaces, and common punctuation
  // This regex keeps Hindi Unicode range, English letters (for names/abbreviations), numbers, and punctuation
  const hindiOnlyRegex = /[\u0900-\u097F\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E।,!?;:\-"'"()।0-9]+/g;
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
    if (sentence.match(/^[\s।!?।\n\r,;:'"()]+$/)) {
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

// Function to determine category based on content
function determineCategory(title: string, content: string): string {
  // Simple heuristic to categorize content as poem or story
  const poemIndicators = ['गीत', 'कविता', 'शेर', 'शायरी', 'verses', 'poem', 'poetry', 'कविता', 'गजल', 'शेर', 'गीत'];
  const storyIndicators = ['कहानी', 'story', 'tale', 'narrative', 'लघुकथा', 'कहानि'];
  
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  for (const indicator of poemIndicators) {
    if (lowerTitle.includes(indicator) || lowerContent.includes(indicator)) {
      return 'poems';
    }
  }
  
  for (const indicator of storyIndicators) {
    if (lowerTitle.includes(indicator) || lowerContent.includes(indicator)) {
      return 'stories';
    }
  }
  
  // Default to poems if not clearly a story
  return 'poems';
}

// Function to extract first paragraph as title if title is empty
function extractFirstParagraph(content: string): string {
  // Look for the first substantial text segment in the content
  const cleaned = cleanContent(content);
  const sentences = cleaned.split(/([।!?।\n\r]+)/);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Return the first sentence that has meaningful content
    if (trimmed && trimmed.length > 5 && !trimmed.match(/^[\s।!?।\n\r,;:'"()=-]+$/)) {
      // Limit to first 60 characters to make a reasonable title
      return trimmed.substring(0, 60) + (trimmed.length > 60 ? '...' : '');
    }
  }
  
  // If no good title found, create one based on content length
  return `Post ${Math.floor(Math.random() * 10000)}`;
}

// Function to add missing posts from XML to Sanity
async function addMissingPosts() {
  try {
    console.log('Adding missing posts from XML to Sanity...');
    
    // Read the XML file
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
    
    // Fetch all existing posts from Sanity to check for duplicates
    const existingPosts = await client.fetch('*[_type == "post"]{ title, slug }');
    console.log(`Found ${existingPosts.length} existing posts in Sanity.`);
    
    // Create a set of existing titles to avoid duplicates
    const existingTitles = new Set(existingPosts.map(post => post.title));
    const existingSlugs = new Set(existingPosts.map(post => post.slug.current));
    
    // Define titles to exclude
    const excludedTitles = ['Untitled', 'Beyond the Obstacle', 'The Art of Connection', 'he rt of onnection'];
    
    let addedCount = 0;
    
    for (const item of items) {
      // Only process posts, not pages or other content types
      if (item['wp:post_type'] && item['wp:post_type'][0] !== 'post') {
        continue;
      }
      
      // Only process published posts
      if (item['wp:status'] && item['wp:status'][0] !== 'publish') {
        continue;
      }
      
      const title = item.title?.[0]?.replace(/[<!\[CDATA\[]|]]>/g, '') || '';
      const content = item['content:encoded']?.[0]?.replace(/[<!\[CDATA\[]|]]>/g, '') || '';
      
      // Skip if no content
      if (!content.trim()) {
        continue;
      }
      
      // Check if this is an excluded title
      if (excludedTitles.some(excluded => title.includes(excluded))) {
        continue;
      }
      
      // Determine the actual title (use first paragraph if title is empty)
      let actualTitle = title.trim();
      if (!actualTitle) {
        actualTitle = extractFirstParagraph(content);
      }
      
      // Check if this post already exists
      if (existingTitles.has(actualTitle)) {
        console.log(`Post with title "${actualTitle}" already exists, skipping...`);
        continue;
      }
      
      // Generate slug from title
      const transliterate = (str: string) => {
        // A simple transliteration function for Hindi to English
        const hindiToEnglish: {[key: string]: string} = {
          'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
          'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri', 'ॠ': 'rii',
          'ऌ': 'li', 'ॡ': 'lii', 'अं': 'am', 'अः': 'aha', 'क': 'ka', 'ख': 'kha',
          'ग': 'ga', 'घ': 'gha', 'ङ': 'na', 'च': 'cha', 'छ': 'chha', 'ज': 'ja',
          'झ': 'jha', 'ञ': 'nya', 'ट': 'tta', 'ठ': 'ttha', 'ड': 'dda', 'ढ': 'ddha',
          'ण': 'nna', 'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
          'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma', 'य': 'ya',
          'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha', 'ष': 'ssha', 'स': 'sa',
          'ह': 'ha', 'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
          'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'm', 'ः': 'aha',
          '।': '', '॥': '', ' ': '-', '"': '', "'": '', '`': ''
        };
        
        let result = '';
        for (let i = 0; i < str.length; i++) {
          const char = str.charAt(i);
          result += hindiToEnglish[char] || char;
        }
        return result;
      };
      
      const slugText = transliterate(actualTitle.substring(0, 80)).toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      // Check if slug already exists
      if (existingSlugs.has(slugText)) {
        console.log(`Post with slug "${slugText}" already exists, skipping...`);
        continue;
      }
      
      // Clean content by removing contact numbers
      const contactPattern = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
      const cleanContentStr = content.replace(contactPattern, '')
                                    .replace(/M[:\s]*\d+/gi, '') // Remove M: followed by numbers
                                    .replace(/mobile[:\s]*\d+/gi, '') // Remove mobile followed by numbers
                                    .replace(/contact[:\s]*\d+/gi, '') // Remove contact followed by numbers
                                    .replace(/\s+/g, ' ') // Clean up extra spaces
                                    .trim();
      
      // Convert HTML content to Sanity blocks
      const body = contentToSanityBlocks(cleanContentStr);
      
      // Determine category (poems or stories)
      const category = determineCategory(actualTitle, cleanContentStr);
      
      // Format date properly
      const publishDate = item['wp:post_date']?.[0] || new Date().toISOString();
      
      // Get placeholder image reference
      const placeholderImageRef = 'image-2701a2499bfbdb51822ed69b6e9753939c30b745-800x400-svg'; // Use the existing placeholder
      
      // Create the post in Sanity
      const newPost = {
        _type: 'post',
        title: actualTitle,
        slug: {
          current: slugText || 'untitled-' + Date.now()
        },
        category,
        bannerImage: {
          asset: {
            _ref: placeholderImageRef,
            _type: 'reference'
          }
        },
        publishedAt: publishDate,
        body
      };
      
      await client.create(newPost);
      addedCount++;
      console.log(`Added new post: ${actualTitle}`);
    }
    
    console.log(`Added ${addedCount} new posts to Sanity.`);
  } catch (error) {
    console.error('Error adding missing posts:', error);
  }
}

addMissingPosts();