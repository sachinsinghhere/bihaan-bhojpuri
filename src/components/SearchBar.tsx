'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XIcon } from 'lucide-react';
import { urlForImage } from '@/lib/sanity';

// Define the post type based on your Sanity schema
interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  featured: boolean;
  pinned: boolean;
  likes: number;
  bannerImage?: any;
  publishedAt: string;
}

interface SearchBarProps {
  onSearch?: (results: Post[]) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search...' }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      if (onSearch) onSearch([]);
      return;
    }

    setIsLoading(true);

    try {
      // Call the API route to search posts by title and/or slug
      const response = await fetch(`/api/search?term=${encodeURIComponent(term)}`);

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);

        if (onSearch) {
          onSearch(results);
        }
      } else {
        console.error('Search API error');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a search result
  const handleResultClick = (slug: string) => {
    router.push(`/post/${slug}`);
    setShowResults(false);
    setSearchTerm('');
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm && setShowResults(true)}
          placeholder={placeholder}
          className="pl-12 pr-12 py-3 w-full text-lg rounded-xl border-2 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
        </div>

        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full"
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
              setShowResults(false);
              if (onSearch) onSearch([]);
            }}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-background border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto backdrop-blur-sm bg-opacity-90">
          <ul>
            {searchResults.map((result) => (
              <li
                key={result._id}
                className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 flex items-center transition-all duration-200"
                onClick={() => handleResultClick(result.slug.current)}
              >
                {result.bannerImage?.asset?._ref && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0 border border-border">
                    <img
                      src={urlForImage(result.bannerImage).url()}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="font-medium text-sm truncate">{result.title}</div>
                  <div className="text-xs text-muted-foreground capitalize flex items-center">
                    {result.featured ? '🌟 Featured' : result.pinned ? '📌 Pinned' : '📝 Article'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && searchTerm && searchResults.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-background border border-border rounded-xl shadow-xl p-4 backdrop-blur-sm bg-opacity-90">
          No posts found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}