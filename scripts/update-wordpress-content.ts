import fs from 'fs';
import xml2js from 'xml2js';
import { transliterate } from 'transliteration';
import { JSDOM } from 'jsdom';
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

interface WordPressItem {
  title: string[];
  'content:encoded': string[];
  'wp:post_type': string[];
  'wp:post_date': string[];
  'wp:status': string[];
  category?: { _: string; $: { domain: string; nicename: string } }[];
}

interface SanityPost {
  _id?: string;
  _type: string;
  title: string;
  slug: {
    current: string;
  };
  category: string;
  bannerImage?: {
    asset: {
      _ref: string;
      _type: string;
    };
  };
  publishedAt: string;
  body: any[];
}

// Function to upload a placeholder image to Sanity if it doesn't exist
async function uploadPlaceholderImage(): Promise<string> {
  try {
    // First, check if a placeholder image already exists
    const existingImages = await client.fetch(
      `*[_type == "sanity.imageAsset" && metadata.originalFilename match "placeholder*"][0...1]`
    );
    
    if (existingImages.length > 0) {
      console.log(`Using existing placeholder image with ID: ${existingImages[0]._id}`);
      return existingImages[0]._id;
    }
    
    // If no placeholder exists, create and upload one
    // For now, we'll create a simple SVG placeholder
    const svgContent = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="400" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#666">
        Bihaan Bhojpuri Placeholder
      </text>
    </svg>`;
    
    // Convert SVG to blob and upload
    const buffer = Buffer.from(svgContent);

    // Upload the image to Sanity
    const imageAsset = await client.assets.upload('image', buffer, {
      contentType: 'image/svg+xml',
      filename: 'placeholder-image.svg'
    });
    
    console.log(`Uploaded placeholder image with ID: ${imageAsset._id}`);
    return imageAsset._id;
  } catch (error) {
    console.error('Error uploading placeholder image:', error);
    // Return a default placeholder if upload fails
    throw error;
  }
}

async function parseWordPressXML(filePath: string): Promise<WordPressItem[]> {
  const xmlData = fs.readFileSync(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlData, (err: Error | null, result: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      const items: WordPressItem[] = result.rss.channel[0].item || [];
      resolve(items);
    });
  });
}

function extractFirstParagraph(content: string): string {
  // Extract the first paragraph from WordPress content
  const dom = new JSDOM(content, { contentType: 'text/html' });
  const document = dom.window.document;
  const firstPara = document.querySelector('p');
  return firstPara ? firstPara.textContent?.trim() || '' : '';
}

function removeContactNumbers(text: string): string {
  // Remove phone numbers in various formats
  return text.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '')
             .replace(/M[:\s]*\d+/gi, '') // Remove M: followed by numbers
             .replace(/mobile[:\s]*\d+/gi, '') // Remove mobile followed by numbers
             .replace(/contact[:\s]*\d+/gi, '') // Remove contact followed by numbers
             .replace(/\s+/g, ' ') // Clean up extra spaces
             .trim();
}

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

function htmlToSanityBlocks(html: string): any[] {
  // First, remove CDATA tags and WordPress block comments
  let cleanHtml = html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
                      .replace(/<!--\s*\/?wp:[^>]*-->/g, '')
                      // Remove WordPress block markers like "-- wp:paragraph -->"
                      .replace(/--\s*wp:[^>]*\s*-->/g, '')
                      // Remove HTML tags but preserve content
                      .replace(/<[^>]*>/g, ' ')
                      // Clean up multiple spaces
                      .replace(/\s+/g, ' ')
                      .trim();

  // Split content by newlines or other separators
  const textParts = cleanHtml.split(/[\n\r]+/)
                             .map(part => part.trim())
                             .filter(part => part &&
                                   !/(?:M[:\s]*\d+|mobile[:\s]*\d+|contact[:\s]*\d+|\d{10})/i.test(part) &&
                                   part.length > 2); // Filter out very short parts

  const blocks: any[] = [];

  for (const part of textParts) {
    if (part) {
      blocks.push(createSanityBlock(part));
    }
  }

  return blocks;
}

function determineCategory(title: string, content: string): string {
  // Simple heuristic to categorize content as poem or story
  // You might want to improve this logic based on your specific needs
  const poemIndicators = ['गीत', 'कविता', 'शेर', 'शायरी', 'verses', 'poem', 'poetry', 'कविता', 'गजल', 'शेर'];
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

async function updateOrCreatePosts(posts: SanityPost[]) {
  console.log(`Starting to update/create ${posts.length} posts in Sanity...`);
  
  for (const post of posts) {
    try {
      // Check if post with this slug already exists
      const existingPost = await client.fetch(
        `*[_type == "post" && slug.current == $slug][0]{_id}`,
        { slug: post.slug.current }
      );
      
      if (existingPost && existingPost._id) {
        // Update the existing post
        await client.patch(existingPost._id).set({
          title: post.title,
          slug: post.slug,
          category: post.category,
          bannerImage: post.bannerImage,
          publishedAt: post.publishedAt,
          body: post.body
        }).commit();
        
        console.log(`Successfully updated post: ${post.title}`);
      } else {
        // Create a new post
        await client.create(post);
        console.log(`Successfully created post: ${post.title}`);
      }
    } catch (error) {
      console.error(`Error processing post "${post.title}":`, error);
    }
  }
  
  console.log('Update/Create process completed!');
}

async function main() {
  try {
    console.log('Parsing WordPress XML file...');
    const items = await parseWordPressXML('bihaanbhojpuri.WordPress.xml');
    
    console.log(`Found ${items.length} items in the XML file.`);
    
    // Upload or get the placeholder image
    const placeholderImageRef = await uploadPlaceholderImage();
    
    const posts: SanityPost[] = [];
    
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
      
      // Skip if no title or content
      if (!title.trim() || !content.trim()) {
        continue;
      }

      // Extract first paragraph for title if title is empty
      const firstParagraph = extractFirstParagraph(content);
      const finalTitle = title.trim() || firstParagraph;

      if (!finalTitle) {
        continue;
      }

      // Skip unwanted posts
      const unwantedTitles = ['Untitled', 'Beyond the Obstacle', 'The Art of Connection', 'he rt of onnection'];
      if (unwantedTitles.some(unwanted => finalTitle.includes(unwanted))) {
        continue;
      }
      
      // Generate slug from title (transliterate Hindi to English)
      const slugText = transliterate(finalTitle.substring(0, 80)).toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      // Clean content by removing contact numbers
      const cleanContent = removeContactNumbers(content);
      
      // Convert HTML content to Sanity blocks
      const body = htmlToSanityBlocks(cleanContent);
      
      // Determine category (poems or stories)
      const category = determineCategory(title, content);
      
      // Format date properly
      const publishDate = item['wp:post_date']?.[0] || new Date().toISOString();
      
      const sanityPost: SanityPost = {
        _type: 'post',
        title: finalTitle,
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
      
      posts.push(sanityPost);
    }
    
    console.log(`Processed ${posts.length} posts for update/create.`);
    
    await updateOrCreatePosts(posts);
    
    console.log('Preview of processed posts:');
    posts.slice(0, 3).forEach((post, index) => {
      console.log(`${index + 1}. Title: ${post.title}`);
      console.log(`   Slug: ${post.slug.current}`);
      console.log(`   Category: ${post.category}`);
      console.log(`   Body blocks: ${post.body.length}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error processing WordPress XML:', error);
  }
}

main();