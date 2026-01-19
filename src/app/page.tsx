import { getAllPosts } from "@/lib/sanity";
import PostCard from "@/components/PostCard";

// Function to extract a text excerpt from PortableText
function extractExcerpt(body: any[], maxLength: number = 150): string {
  if (!body || !Array.isArray(body)) return "";

  let text = "";
  for (const block of body) {
    if (block._type === 'block' && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (child._type === 'span' && typeof child.text === 'string') {
          text += child.text + " ";
        }
      }
    }
  }

  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export default async function Home() {
  // Fetch all posts
  const posts = await getAllPosts();

  console.log(`Fetched all posts:`, posts.length, 'posts'); // Debug log

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 font-tiro-devanagari-hindi">Bihaan Bhojpuri</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-noto-serif-devanagari">
          आधुनिक बिहारी साहित्य के डिजिटल संग्रह
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any) => {
          // Log the slug to see if it's properly formed
          console.log(`Post ID: ${post._id}, Title: ${post.title}, Slug: ${post.slug?.current}`);

          return (
            <PostCard
              key={post._id}
              id={post._id}
              title={post.title}
              slug={post.slug?.current || ''}
              bannerImage={post.bannerImage}
              publishedAt={post.publishedAt}
              excerpt={extractExcerpt(post.body)}
            />
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p>No posts available at the moment.</p>
        </div>
      )}
    </div>
  );
}