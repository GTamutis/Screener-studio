import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listApprovedLibraryQuestions } from "@/app/actions/question-library";
import { listScreenerQuestions } from "@/app/actions/screener-questions";
import { getScreenerById } from "@/app/actions/screeners";
import { ScreenerEditor } from "@/components/screener-editor/screener-editor";

export async function generateMetadata({
  params,
}: {
  params: { screenerId: string };
}): Promise<Metadata> {
  try {
    const screener = await getScreenerById(params.screenerId);
    return { title: `${screener.name} · Screener editor` };
  } catch {
    return { title: "Screener editor" };
  }
}

export default async function WorkspaceScreenerEditorPage({
  params,
}: {
  params: { screenerId: string };
}) {
  let screener;
  let questions;
  let libraryQuestions;

  try {
    screener = await getScreenerById(params.screenerId);
    const [questionsResult, libraryResult] = await Promise.all([
      listScreenerQuestions(params.screenerId),
      listApprovedLibraryQuestions(),
    ]);
    if ("error" in questionsResult) {
      throw new Error(questionsResult.error);
    }
    if ("error" in libraryResult) {
      throw new Error(libraryResult.error);
    }
    questions = questionsResult;
    libraryQuestions = libraryResult;
  } catch {
    notFound();
  }

  return (
    <ScreenerEditor
      screener={screener}
      initialQuestions={questions}
      libraryQuestions={libraryQuestions}
    />
  );
}
