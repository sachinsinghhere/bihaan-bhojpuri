"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity";

interface PostCardProps {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string; // First part of the body
  bannerImage?: {
    asset: {
      _ref: string;
      _type: string;
    };
  };
}

export default function PostCard({ id, title, slug, publishedAt, excerpt, bannerImage }: PostCardProps) {
  return (
    <Link href={`/post/${slug}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {bannerImage?.asset?._ref && (
          <div className="relative h-40 w-full">
            <Image
              src={urlForImage(bannerImage).url()}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardContent className={`p-6 ${bannerImage?.asset?._ref ? 'pt-4' : ''}`}>
          <div className="flex justify-end items-center text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{format(new Date(publishedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</h3>
          <p className="text-muted-foreground" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}