import fs from 'fs';
import xml2js from 'xml2js';
import { client } from '../src/lib/sanity';

// Define the structure of a WordPress post
interface WordPressPost {
  title: string;
  content: string;
  date: string;
  slug: string;
  category: string;
}

// Function to parse the XML file
async function parseXMLFile(filePath: string): Promise<WordPressPost[]> {
  const xmlData = fs.readFileSync(filePath, 'utf8');
  
  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
  });

  const result: any = await parser.parseStringPromise(xmlData);
  
  const posts: WordPressPost[] = [];
  
  // Extract posts from the XML structure
  const wpNamespace = result.rss.channel['wp:post_type'] || result.rss.channel.item;
  
  if (Array.isArray(wpNamespace)) {
    wpNamespace.forEach((item: any) => {
      if (item['wp:post_type'] === 'post' || item['wp:type'] === 'post') {
        const post: WordPressPost = {
          title: item.title || '',
          content: item['content:encoded'] || item.description || '',
          date: item.pubDate || item['wp:post_date'] || new Date().toISOString(),
          slug: item['wp:post_name'] || generateSlug(item.title),
          category: determineCategoryFromTags(item.category) || 'stories', // Default to 'stories'
        };
        posts.push(post);
      }
    });
  } else if (wpNamespace && wpNamespace['wp:post_type'] === 'post') {
    // Handle single post case
    const item = wpNamespace;
    const post: WordPressPost = {
      title: item.title || '',
      content: item['content:encoded'] || item.description || '',
      date: item.pubDate || item['wp:post_date'] || new Date().toISOString(),
      slug: item['wp:post_name'] || generateSlug(item.title),
      category: determineCategoryFromTags(item.category) || 'stories',
    };
    posts.push(post);
  }

  return posts;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to determine category from tags or categories
function determineCategoryFromTags(categories: any): string | null {
  if (!categories) return null;
  
  const catArray = Array.isArray(categories) ? categories : [categories];
  
  for (const cat of catArray) {
    const catName = typeof cat === 'string' ? cat : cat['_'] || cat['$']?.nicename || cat['$']?.domain;
    
    if (typeof catName === 'string') {
      const lowerCat = catName.toLowerCase();
      if (lowerCat.includes('poem') || lowerCat.includes('कविता') || lowerCat.includes('गीत')) {
        return 'poems';
      } else if (lowerCat.includes('story') || lowerCat.includes('कहानी') || lowerCat.includes('निबंध')) {
        return 'stories';
      }
    }
  }
  
  return null;
}

// Convert HTML content to Sanity Portable Text
function htmlToPortableText(html: string): any[] {
  // This is a simplified conversion - in practice, you might want to use a more robust HTML to Portable Text converter
  // For now, we'll just wrap the HTML as a single block
  return [
    {
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: html,
          marks: [],
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ];
}

// Function to upload a single post to Sanity
async function uploadPostToSanity(post: WordPressPost): Promise<void> {
  try {
    // Check if a post with this slug already exists
    const existingPost = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug: post.slug }
    );

    if (existingPost) {
      console.log(`Post with slug "${post.slug}" already exists, skipping...`);
      return;
    }

    // Create the post document in Sanity
    const document = {
      _type: 'post',
      title: post.title,
      slug: { current: post.slug },
      category: post.category,
      publishedAt: new Date(post.date).toISOString(),
      body: htmlToPortableText(post.content),
    };

    await client.create(document);
    console.log(`Successfully uploaded post: "${post.title}"`);
  } catch (error) {
    console.error(`Error uploading post "${post.title}":`, error);
  }
}

// Main function to run the import
async function importFromXML(xmlFilePath: string): Promise<void> {
  console.log('Starting XML import...');
  
  try {
    // Parse the XML file
    const posts = await parseXMLFile(xmlFilePath);
    
    console.log(`Parsed ${posts.length} posts from XML file`);
    
    // Upload each post to Sanity
    for (const post of posts) {
      await uploadPostToSanity(post);
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('XML import completed!');
  } catch (error) {
    console.error('Error during XML import:', error);
  }
}

// Export the function for use in other modules
export { importFromXML, parseXMLFile };

// If this script is run directly, execute the import
if (require.main === module) {
  const args = process.argv.slice(2);
  const xmlFilePath = args[0];

  if (!xmlFilePath) {
    console.error('Please provide the path to the XML file as an argument:');
    console.error('Usage: npm run import-xml /path/to/wordpress-export.xml');
    process.exit(1);
  }

  importFromXML(xmlFilePath);
}