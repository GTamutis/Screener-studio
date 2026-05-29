"use client";

import { CornerDownRight, IndentDecrease, IndentIncrease, Loader2 } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import {
  nestScreenerQuestionUnderParent,
  unnestScreenerQuestionToTopLevel,
} from "@/app/actions/screener-questions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listNestUnderTargets } from "@/lib/screeners/question-tree";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export function ScreenerQuestionNestMenu({
  screenerId,
  question,
  allQuestions,
  onQuestionsReplaced,
  disabled,
  inline,
}: {
  screenerId: string;
  question: ScreenerQuestion;
  allQuestions: ScreenerQuestion[];
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
  disabled?: boolean;
  /** When true, omit outer flex wrapper (parent provides layout). */
  inline?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const nestTargets = useMemo(
    () => listNestUnderTargets(allQuestions, question.id),
    [allQuestions, question.id],
  );

  const isSubQuestion = question.parentId !== null;
  const showNestUnder = nestTargets.length > 0;

  if (!showNestUnder && !isSubQuestion) return null;

  const handleNestUnder = (parentId: string) => {
    startTransition(async () => {
      const res = await nestScreenerQuestionUnderParent({
        screenerId,
        questionId: question.id,
        parentId,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Question nested.");
      onQuestionsReplaced(res.questions);
    });
  };

  const handleUnnest = () => {
    startTransition(async () => {
      const res = await unnestScreenerQuestionToTopLevel({
        screenerId,
        questionId: question.id,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Question moved to top level.");
      onQuestionsReplaced(res.questions);
    });
  };

  const controls = (
    <>
      {showNestUnder ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))] text-xs font-medium"
              disabled={disabled || pending}
              onClick={(e) => e.stopPropagation()}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <IndentIncrease className="h-3.5 w-3.5" />
              )}
              Nest under…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            {nestTargets.map((target) => (
              <DropdownMenuItem
                key={target.id}
                onClick={() => handleNestUnder(target.id)}
              >
                <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                {target.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {isSubQuestion ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))] text-xs font-medium"
          disabled={disabled || pending}
          onClick={(e) => {
            e.stopPropagation();
            handleUnnest();
          }}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <IndentDecrease className="h-3.5 w-3.5" />
          )}
          Move to top level
        </Button>
      ) : null}
    </>
  );

  if (inline) return controls;

  return <div className="flex flex-wrap gap-2">{controls}</div>;
}
