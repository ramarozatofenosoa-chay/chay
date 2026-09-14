import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import ReactMarkdown from "react-markdown";

export default function ArticleCard({ article }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("article") === article.id;
  const setOpen = (v) => {
    if (v) setSearchParams({ article: article.id });
    else setSearchParams({}, { replace: true });
  };
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all w-full"
      >
        {article.cover_url ? (
          <div className="h-40 overflow-hidden">
            <Image src={article.cover_url} fittingType="fill" className="w-full h-full" />
          </div>
        ) : (
          <div className="h-40 brand-gradient" />
        )}
        <div className="p-5">
          {article.category && (
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              {article.category}
            </span>
          )}
          <h3 className="font-display font-bold text-lg leading-snug line-clamp-2 mt-1">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-foreground/55 mt-2 line-clamp-3">{article.excerpt}</p>
          )}
          {article.author && (
            <p className="text-xs text-foreground/40 mt-3">Par {article.author}</p>
          )}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {article.cover_url && (
            <Image src={article.cover_url} fittingType="fill" className="w-full h-48 rounded-xl mb-4" />
          )}
          <DialogHeader>
            <DialogTitle className="text-2xl">{article.title}</DialogTitle>
            {article.author && (
              <DialogDescription>
                Par {article.author}
                {article.category ? ` · ${article.category}` : ""}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed selectable">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}