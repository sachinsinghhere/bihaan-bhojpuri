import { notFound } from 'next/navigation';

export default function TestSlugRoute({ params }: { params: { slug: string } }) {
  // If no slug is provided, return 404
  if (!params.slug) {
    console.log('No slug provided in params');
    return notFound();
  }

  console.log('TestSlugRoute - Received slug:', params.slug);
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold">Debug: Testing Slug Route</h1>
      <p>Received slug: {params.slug}</p>
      <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
    </div>
  );
}

// Ensure the dynamic route is handled properly
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `Testing - ${params.slug}`,
  };
}