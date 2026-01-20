import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { Image } from "@sanity/types";

export const client = createClient({
  projectId:
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder-project-id",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01", // fallback to today
  useCdn: false, // `false` if you want to ensure fresh data
  token: process.env.SANITY_WRITE_TOKEN, // Needed for write operations
});

const builder = imageUrlBuilder(client);

export function urlForImage(source: Image) {
  return builder.image(source);
}

// Fetch posts with pagination - reliable approach
export async function getPosts(page: number = 1, limit: number = 10) {
  try {
    // Fetch all posts ordered by published date
    const allPostsQuery = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      featured,
      pinned,
      likes,
      bannerImage,
      publishedAt,
      body
    }`;

    const allPosts = await client.fetch(allPostsQuery);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Apply pagination by slicing the results
    const paginatedPosts = allPosts.slice(offset, offset + limit);


    return paginatedPosts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return []; // Return empty array if there's an error
  }
}

// Fetch featured posts
export async function getFeaturedPosts() {
  try {
    const query = `*[_type == "post" && featured == true] | order(publishedAt desc) {
      _id,
      title,
      slug,
      featured,
      pinned,
      likes,
      bannerImage,
      publishedAt,
      body
    }`;

    const posts = await client.fetch(query);


    return posts;
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return []; // Return empty array if there's an error
  }
}

// Fetch pinned posts
export async function getPinnedPosts() {
  try {
    const query = `*[_type == "post" && pinned == true] | order(publishedAt desc) {
      _id,
      title,
      slug,
      featured,
      pinned,
      likes,
      bannerImage,
      publishedAt,
      body
    }`;

    const posts = await client.fetch(query);


    return posts;
  } catch (error) {
    console.error("Error fetching pinned posts:", error);
    return []; // Return empty array if there's an error
  }
}

// Get total count of posts for pagination
export async function getTotalPostsCount() {
  try {
    const query = `count(*[_type == "post"])`;

    const count = await client.fetch(query);


    return count;
  } catch (error) {
    console.error("Error fetching total posts count:", error);
    return 0; // Return 0 if there's an error
  }
}

// Fetch all posts (maintaining backward compatibility)
export async function getAllPosts() {
  try {
    const query = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      featured,
      pinned,
      likes,
      bannerImage,
      publishedAt,
      body
    }`;

    const posts = await client.fetch(query);


    return posts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return []; // Return empty array if there's an error
  }
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string) {
  try {

    const post = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        featured,
        pinned,
        likes,
        bannerImage,
        publishedAt,
        body
      }`,
      { slug }
    );


    return post;
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null; // Return null if there's an error
  }
}
