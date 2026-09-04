"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { HASHTAG_RE, WIKILINK_RE } from "@/lib/utils";

type LinkMap = Record<string, string>; // title(lowercase) -> card id

/**
 * Pre-process [[wikilinks]] and #hashtags into markdown links with a special scheme,
 * then render them as Next links.
 */
function preprocess(src: string, links: LinkMap) {
  let out = src.replace(WIKILINK_RE, (_m, inner: string) => {
    const [rawTitle, alias] = inner.split("|");
    const title = rawTitle.trim();
    const id = links[title.toLowerCase()];
    const label = (alias ?? title).trim();
    return id
      ? `[${label}](wiki:${id})`
      : `[${label}](wikinew:${encodeURIComponent(title)})`;
  });
  out = out.replace(HASHTAG_RE, (_m, pre: string, tag: string) => {
    return `${pre}[#${tag}](tag:${encodeURIComponent(tag.toLowerCase())})`;
  });
  return out;
}

export function Markdown({
  content,
  links = {},
  className = "",
}: {
  content: string;
  links?: LinkMap;
  className?: string;
}) {
  const processed = preprocess(content, links);
  return (
    <div className={`prose-pkm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          a({ href, children }) {
            const h = href ?? "";
            if (h.startsWith("wiki:")) {
              return (
                <Link href={`/cards/${h.slice(5)}`} className="wikilink">
                  {children}
                </Link>
              );
            }
            if (h.startsWith("wikinew:")) {
              return (
                <Link
                  href={`/cards/new?title=${h.slice(8)}`}
                  className="wikilink opacity-70"
                >
                  {children}
                </Link>
              );
            }
            if (h.startsWith("tag:")) {
              return (
                <Link href={`/tags/${h.slice(4)}`} className="hashtag">
                  {children}
                </Link>
              );
            }
            return (
              <a href={h} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
