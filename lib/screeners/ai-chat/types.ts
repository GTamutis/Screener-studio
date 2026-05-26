import type { QuestionLibraryType } from "@/lib/question-library/types";
import type { QuestionAnswerOption } from "@/lib/question-library/types";

export type AiSuggestedQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionLibraryType;
  answerOptions: QuestionAnswerOption[];
};

export type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: AiSuggestedQuestion[];
};
