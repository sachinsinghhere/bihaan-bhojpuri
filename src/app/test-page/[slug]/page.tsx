import { notFound } from 'next/navigation';

export default async function TestPageRoute({ params }: { params: { slug: string } }) {
  console.log('TestPageRoute - params:', params);
  console.log('TestPageRoute - params.slug:', params.slug);
  console.log('TestPageRoute - typeof params:', typeof params);
  console.log('TestPageRoute - typeof params.slug:', typeof params.slug);
  
  // Check if params is a promise
  if (params instanceof Promise) {
    console.log('params is a Promise');
  } else {
    console.log('params is NOT a Promise');
  }
  
  // Try to await params
  const awaitedParams = await params;
  console.log('TestPageRoute - awaited params:', awaitedParams);
  
  // Try to await params.slug
  const awaitedSlug = await params.slug;
  console.log('TestPageRoute - awaited params.slug:', awaitedSlug);
  
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