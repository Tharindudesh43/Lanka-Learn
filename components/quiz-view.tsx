"use client";

import { useState } from "react";
import { HelpCircle, Award, RefreshCw, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { QuizContent, QuizQuestion } from "@/types";

interface QuizViewProps {
  contentJson: string;
  lessonId: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export default function QuizView({
  contentJson,
  lessonId,
  isCompleted = false,
  onComplete,
}: QuizViewProps) {
  // Parse content safely
  let quiz: QuizContent = { questions: [], passingScore: 70 };
  try {
    quiz = JSON.parse(contentJson);
  } catch (err) {
    console.error("Failed to parse quiz JSON:", err);
  }

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionIndex -> selectedOptionIndex
  const [showResult, setShowResult] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [passed, setPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = quiz.questions || [];
  const passingScore = quiz.passingScore || 70;

  const handleSelectOption = (optionIndex: number) => {
    if (showResult) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (questions.length === 0) return;

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / questions.length) * 100);
    const hasPassed = percent >= passingScore;

    setScorePercent(percent);
    setPassed(hasPassed);
    setShowResult(true);

    if (hasPassed) {
      try {
        setIsSubmitting(true);
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            completed: true,
          }),
        });

        if (res.ok && onComplete) {
          onComplete();
        }
      } catch (err) {
        console.error("Failed to update progress for quiz:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setScorePercent(0);
    setPassed(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-850 dark:text-slate-400">
        This quiz does not have any questions.
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = answers[currentQuestionIndex] !== undefined;

  return (
    <div className="mx-auto max-w-2xl w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-850 dark:bg-slate-900">
      
      {!showResult ? (
        // Question View
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-850">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xxs font-bold text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">
              Passing Score: {passingScore}%
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-150 mb-6 leading-snug">
            {currentQuestion.question}
          </h3>

          {/* Options Grid */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestionIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left text-sm font-semibold transition cursor-pointer ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 text-blue-800 dark:border-blue-500 dark:bg-blue-950/10 dark:text-blue-400"
                      : "border-slate-200 hover:border-slate-350 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 dark:hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Results View
        <div className="flex flex-col items-center text-center py-4">
          <div className="bg-purple-50 p-4 rounded-full mb-6 dark:bg-purple-950/20">
            <Award className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>

          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Quiz Completed!
          </h3>
          
          <div className="mb-6">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{scorePercent}%</span>
            <span className="text-sm text-slate-400 dark:text-slate-500 font-semibold block mt-1">
              Your Score
            </span>
          </div>

          {passed ? (
            <div className="mb-8 rounded-2xl bg-emerald-50 border border-emerald-250 px-5 py-3 text-sm font-bold text-emerald-800 flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Congratulations, you passed! This lesson has been marked as complete.
            </div>
          ) : (
            <div className="mb-8 rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-sm font-bold text-red-800 flex items-center gap-2 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              You did not pass. You need {passingScore}% or higher to pass.
            </div>
          )}

          {/* Detailed Question Review */}
          <div className="w-full text-left space-y-5 border-t border-slate-100 pt-6 mb-8 dark:border-slate-850">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Question Details:</h4>
            {questions.map((q, idx) => {
              const selected = answers[idx];
              const correct = q.correctAnswerIndex;
              const isCorrect = selected === correct;

              return (
                <div key={idx} className="rounded-xl border border-slate-100 p-4 dark:border-slate-850 dark:bg-slate-950/10">
                  <div className="flex gap-2.5 items-start">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="text-xxs text-slate-500 dark:text-slate-400 mt-2">
                        Your answer: <span className={isCorrect ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>{q.options[selected] || "None"}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-xxs text-emerald-600 font-bold mt-1">
                          Correct answer: {q.options[correct]}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xxs text-slate-450 dark:text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg dark:bg-slate-950">
                          Explanation: {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRetake}
            className="flex items-center gap-2 rounded-xl border border-slate-250 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
          >
            <RefreshCw className="h-4 w-4" />
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}
