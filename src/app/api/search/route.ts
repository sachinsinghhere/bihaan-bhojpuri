import { searchPosts } from "@/lib/sanity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");

  if (!term) {
    return Response.json({ error: "Search term is required" }, { status: 400 });
  }

  try {
    const results = await searchPosts(term);
    return Response.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return Response.json({ error: "Failed to search posts" }, { status: 500 });
  }
}