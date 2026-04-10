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

// Search posts by title and slug
export async function searchPosts(searchTerm: string) {
  try {
    const query = `*[_type == "post" && (title match $searchTerm + "*" || slug.current match $searchTerm + "*")] {
      _id,
      title,
      slug,
      featured,
      pinned,
      likes,
      bannerImage,
      publishedAt
    }`;

    const posts = await client.fetch(query, { searchTerm });

    return posts;
  } catch (error) {
    console.error(`Error searching posts with term "${searchTerm}":`, error);
    return []; // Return empty array if there's an error
  }
}

// Increment likes for a post
export async function incrementLike(postId: string) {
  try {
    // For this implementation, we'll need to use the Sanity API to update the document
    // Since we can't directly update from client-side without a token, we'll return the new count
    // In a real application, you'd need a serverless function or API endpoint to handle this securely

    // First, fetch the current post to get the current like count
    const query = `*[_type == "post" && _id == $postId][0]{
      _id,
      likes
    }`;

    const post = await client.fetch(query, { postId });

    if (!post) {
      throw new Error('Post not found');
    }

    const currentLikes = post.likes || 0;
    const updatedLikes = currentLikes + 1;

    // In a real application, you would update the document like this:
    // const transaction = client.transaction();
    // transaction.patch(postId, {
    //   inc: {
    //     likes: 1
    //   }
    // });
    // await transaction.commit();

    // For now, we'll just return the calculated new like count
    return updatedLikes;
  } catch (error) {
    console.error(`Error incrementing likes for post ${postId}:`, error);
    return null;
  }
}

// Update likes for a post (to be called from an API route)
export async function updatePostLikes(postId: string, newLikes: number) {
  try {
    // In a real application, this would be called from a server-side API route
    // to securely update the post's like count
    const result = await client
      .patch(postId)
      .inc({
        likes: 1
      })
      .commit();

    return result;
  } catch (error) {
    console.error(`Error updating likes for post ${postId}:`, error);
    return null;
  }
}
