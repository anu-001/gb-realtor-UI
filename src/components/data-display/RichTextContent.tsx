import DOMPurify from "dompurify";
import { cn } from "@/utils/cn";

interface RichTextContentProps {
  html: string;
  className?: string;
}

const allowedTags = ["p", "strong", "em", "u", "s", "ul", "ol", "li", "h2", "h3", "a", "mark", "blockquote", "br"];

const allowedAttrs = ["href", "target"];

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitizedHtml}</div>`, "text/html");
  doc.querySelectorAll("a").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  });
  const finalHtml = doc.body.firstElementChild?.innerHTML ?? sanitizedHtml;

  return <div className={cn("tiptap-content", className)} dangerouslySetInnerHTML={{ __html: finalHtml }} />;
}
