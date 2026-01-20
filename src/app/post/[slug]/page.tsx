import { getPostBySlug, getAllPosts } from "@/lib/sanity";
import { PortableText } from "@portabletext/react";
import { CalendarIcon, ShareIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity";

// Custom PortableText components for rendering
const portableTextComponents = {
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-tiro-devanagari-hindi font-bold mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-tiro-devanagari-hindi font-semibold mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-tiro-devanagari-hindi font-medium mt-4 mb-2">
        {children}
      </h3>
    ),
    normal: ({ children }: any) => (
      <p className="font-noto-serif-devanagari text-lg leading-relaxed mb-4">
        {children}
      </p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ children, value }: any) => (
      <a href={value?.href} className="text-primary underline">
        {children}
      </a>
    ),
  },
};

// In Next.js 16+ with Turbopack, params is a Promise that needs to be awaited
export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;

  // Ensure we have a slug
  if (!slug) {
    const allPosts = await getAllPosts();

    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Invalid URL</h1>
        <p className="mt-4">No slug was provided in the URL.</p>
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Available posts:</h2>
          <ul className="mt-2">
            {allPosts.map((p: any) => (
              <li key={p._id} className="py-1">
                <a
                  href={`/post/${p.slug.current}`}
                  className="text-blue-600 hover:underline"
                >
                  {p.title} (slug: {p.slug.current})
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
          ← Back to Home
        </a>
      </div>
    );
  }

  // Fetch the post
  const post = await getPostBySlug(slug);

  if (!post) {
    const allPosts = await getAllPosts();

    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-4">The post with slug "{slug}" could not be found.</p>
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Available posts:</h2>
          <ul className="mt-2">
            {allPosts.map((p: any) => (
              <li key={p._id} className="py-1">
                <a
                  href={`/post/${p.slug.current}`}
                  className="text-blue-600 hover:underline"
                >
                  {p.title} (slug: {p.slug.current})
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
          ← Back to Home
        </a>
      </div>
    );
  }

  // Function to share to WhatsApp
  const shareToWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out this Bhojpuri literature: ${post.title}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <article className="container mx-auto py-12 px-4 max-w-2xl">
      {post.bannerImage?.asset?._ref && (
        <div className="relative h-64 w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={urlForImage(post.bannerImage).url()}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              post.category === "Poems"
                ? "bg-[#8c6a5d] text-white"
                : "bg-[#5f6f52] text-white"
            }`}
          >
            {post.category}
          </span>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </time>
          </div>
        </div>

        <h1 className="text-4xl font-tiro-devanagari-hindi font-bold mb-6">
          {post.title}
        </h1>
      </div>

      <div className="prose prose-lg max-w-none font-noto-serif-devanagari">
        <PortableText value={post.body} components={portableTextComponents} />
      </div>

      <div className="mt-12 pt-6 border-t border-divider flex justify-end">
        {/* Share button with direct link to WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Check out this Bhojpuri literature: ${post.title} - ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          <ShareIcon className="h-4 w-4" />
          Share to WhatsApp
        </a>
      </div>
    </article>
  );
}
