import { defineField, defineType } from "sanity";
import { defineArrayMember } from "sanity";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  liveEdit: true,  // Enable live edit for this document type
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bannerImage",
      title: "Banner Image",
      type: "image",
      description: "An optional banner image for the post",
      options: {
        hotspot: true, // Allow users to select a focal point for the image
      },
    }),
    defineField({
      name: "featured",
      title: "Featured Post",
      type: "boolean",
      description: "Check this box to mark this as a featured post",
      initialValue: false,
    }),
    defineField({
      name: "pinned",
      title: "Pinned Post",
      type: "boolean",
      description: "Check this box to pin this post to the top",
      initialValue: false,
    }),
    defineField({
      name: "likes",
      title: "Likes Count",
      type: "number",
      description: "Number of likes for this post",
      initialValue: 0,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H1", value: "h1" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
            ],
          },
        }),
      ],
    }),
  ],
});
