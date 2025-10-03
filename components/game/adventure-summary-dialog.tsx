"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen } from "lucide-react";
import { getAdventureSummary } from "@/app/actions/summary-actions";
import ReactMarkdown from "react-markdown";

interface AdventureSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdventureSummaryDialog({
  open,
  onOpenChange,
}: AdventureSummaryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [lastSummaryAt, setLastSummaryAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSummary();
    }
  }, [open]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const result = await getAdventureSummary();
      if (result.success) {
        setSummary(result.summary || null);
        setLastSummaryAt(result.lastSummaryAt || null);
      }
    } catch (error) {
      console.error("[v0] Error loading summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] z-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Adventure Summary
          </DialogTitle>
          <DialogDescription>
            {lastSummaryAt
              ? `Last updated: ${formatDate(lastSummaryAt)}`
              : "No summary generated yet"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : summary ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No adventure summary yet
            </p>
            <p className="text-sm text-muted-foreground">
              Play through your adventure and click "Summarize Adventure" to
              generate a summary
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
