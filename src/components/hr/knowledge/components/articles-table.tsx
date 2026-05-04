"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Archive,
  Globe,
  FileEdit,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
  ARTICLE_STATUS_CONFIG,
  ARTICLE_STATUS_OPTIONS,
} from "../data";
import type { KnowledgeArticle, ArticleStatus } from "../types";

interface ArticlesTableProps {
  articles: KnowledgeArticle[];
  onView: (article: KnowledgeArticle) => void;
  onEdit: (article: KnowledgeArticle) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: ArticleStatus) => void;
  onToggleFeatured: (id: string) => void;
}

function helpfulRate(article: KnowledgeArticle): number {
  const total = (article.helpfulVotes ?? 0) + (article.notHelpfulVotes ?? 0);
  if (total === 0) return 0;
  return Math.round(((article.helpfulVotes ?? 0) / total) * 100);
}

export function ArticlesTable({
  articles,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
}: ArticlesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = articles.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  function handleDeleteConfirm() {
    if (!deleteId) return;
    onDelete(deleteId);
    toast.success("Article deleted.");
    setDeleteId(null);
  }

  function nextStatus(current: ArticleStatus): ArticleStatus {
    if (current === "draft") return "published";
    if (current === "published") return "draft";
    return "published";
  }

  function statusActionLabel(current: ArticleStatus): string {
    if (current === "draft") return "Publish";
    if (current === "published") return "Unpublish";
    return "Re-publish";
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ARTICLE_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ARTICLE_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Helpful</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No articles match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((article) => {
                const catCfg = ARTICLE_CATEGORY_CONFIG[article.category];
                const statusCfg = ARTICLE_STATUS_CONFIG[article.status];
                const rate = helpfulRate(article);
                const isDraft = article.status === "draft";

                return (
                  <TableRow
                    key={article.id}
                    className={isDraft ? "bg-card" : "bg-card"}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground max-w-60">
                            {article.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {article.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="px-1 py-0 text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {article.isFeatured && (
                          <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {article.authorInitials}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {article.authorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {article.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {rate > 0 ? `${rate}%` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {article.updatedAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(article)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(article)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              onToggleStatus(
                                article.id,
                                nextStatus(article.status),
                              );
                              toast.success(
                                `Article ${nextStatus(article.status) === "published" ? "published" : "unpublished"}.`,
                              );
                            }}
                          >
                            {article.status === "published" ? (
                              <FileEdit className="mr-2 h-4 w-4" />
                            ) : (
                              <Globe className="mr-2 h-4 w-4" />
                            )}
                            {statusActionLabel(article.status)}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              onToggleFeatured(article.id);
                              toast.success(
                                article.isFeatured
                                  ? "Removed from featured."
                                  : "Added to featured.",
                              );
                            }}
                          >
                            {article.isFeatured ? (
                              <StarOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Star className="mr-2 h-4 w-4" />
                            )}
                            {article.isFeatured
                              ? "Remove Featured"
                              : "Mark as Featured"}
                          </DropdownMenuItem>
                          {article.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() => {
                                onToggleStatus(article.id, "archived");
                                toast.success("Article archived.");
                              }}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(article.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {articles.length} articles
        </p>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The article will be permanently
              removed from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
