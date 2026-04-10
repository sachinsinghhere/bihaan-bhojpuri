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


  return (
    <div className="min-h-screen">
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div>
              <img
                src="/assets/logos/logo.svg"
                alt="Bihaan Bhojpuri Logo"
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-tiro-devanagari-hindi">Bihaan Bhojpuri</h1>
              <p className="text-sm sm:text-base text-muted-foreground font-noto-serif-devanagari">
                आधुनिक बिहारी साहित्य के डिजिटल संग्रह
              </p>
            </div>
          </div>

          {/* Theme toggle on the right */}
          <div>
            <ThemeToggleServerWrapper />
          </div>
        </div>

        {/* Centered search bar */}
        <div className="mt-8 max-w-2xl mx-auto px-4 flex justify-center">
          <div className="w-full max-w-md">
            <SearchBarServerWrapper />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => {

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
      </main>
    </div>
  );
}

// Wrapper component to handle client-side search bar
async function SearchBarServerWrapper() {
  const SearchBar = (await import('@/components/SearchBar')).default;

  return <SearchBar />;
}

// Wrapper component to handle client-side theme toggle
async function ThemeToggleServerWrapper() {
  const ThemeToggleModule = await import('@/components/ThemeToggle');
  const ThemeToggle = ThemeToggleModule.ThemeToggle;

  return <ThemeToggle />;
}