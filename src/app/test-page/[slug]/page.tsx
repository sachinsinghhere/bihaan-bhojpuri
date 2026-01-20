import { notFound } from 'next/navigation';

export default async function TestPageRoute({ params }: { params: { slug: string } }) {

  // Try to await params
  const awaitedParams = await params;

  // Try to await params.slug
  const awaitedSlug = await params.slug;
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold">Test Page Route</h1>
      <p>Params: {JSON.stringify(params)}</p>
      <p>Slug: {params.slug}</p>
      <p>Awaited Slug: {awaitedSlug}</p>
      <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
    </div>
  );
}