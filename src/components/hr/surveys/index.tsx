"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useSurveys } from "./hooks";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import { StatCards } from "./components/stat-cards";
import { SurveysTable } from "./components/surveys-table";
import { EngagementTrend } from "./components/engagement-trend";
import { SurveyResultsModal } from "./components/survey-results-modal";
import { SurveyFormModal } from "./components/survey-form-modal";
import {
  SURVEY_TYPE_CONFIG,
  PULSE_FREQUENCY_LABEL,
  getResponseRate,
} from "./data";
import type { Survey, NewSurvey } from "./types";

export function SurveysPage() {
  const { data, loading } = useSurveys();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  useEffect(() => {
    if (data) setSurveys(data);
  }, [data]);
  const [formOpen, setFormOpen] = useState(false);
  const [editSurvey, setEditSurvey] = useState<Survey | null>(null);
  const [resultsSurvey, setResultsSurvey] = useState<Survey | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  function handleCreate(data: NewSurvey) {
    const now = new Date().toISOString().split("T")[0];
    const id = `SRV-${String(surveys.length + 1).padStart(3, "0")}`;
    const newSurvey: Survey = {
      id,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      audience: data.audience,
      targetDepartments: data.targetDepartments,
      isAnonymous: data.isAnonymous,
      sendReminder: data.sendReminder,
      questions: data.questions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
        options: q.options,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
      })),
      responses: [],
      totalTargeted: data.totalTargeted,
      startDate: data.startDate,
      endDate: data.endDate,
      pulseFrequency: data.pulseFrequency,
      createdAt: now,
      createdBy: "HR Admin",
      createdByInitials: "HA",
      isArchived: false,
    };
    setSurveys((prev) => [newSurvey, ...prev]);
    setFormOpen(false);
    toast.success(`Survey &ldquo;${data.title}&rdquo; created successfully!`);
  }

  function handleEdit(data: NewSurvey) {
    if (!editSurvey) return;
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id !== editSurvey.id) return s;
        return {
          ...s,
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          audience: data.audience,
          targetDepartments: data.targetDepartments,
          isAnonymous: data.isAnonymous,
          sendReminder: data.sendReminder,
          questions: data.questions.map((q, i) => ({
            ...q,
            id: `q${i + 1}`,
            options: q.options,
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
          })),
          totalTargeted: data.totalTargeted,
          startDate: data.startDate,
          endDate: data.endDate,
          pulseFrequency: data.pulseFrequency,
        };
      }),
    );
    setEditSurvey(null);
    toast.success("Survey updated successfully!");
  }

  function handleCloseSurvey(survey: Survey) {
    setSurveys((prev) =>
      prev.map((s) => (s.id === survey.id ? { ...s, status: "closed" } : s)),
    );
    toast.success(`Survey &ldquo;${survey.title}&rdquo; has been closed.`);
  }

  function handleArchive(survey: Survey) {
    setSurveys((prev) =>
      prev.map((s) =>
        s.id === survey.id ? { ...s, isArchived: true, status: "archived" } : s,
      ),
    );
    toast.success(`Survey archived.`);
  }

  function handleDelete(survey: Survey) {
    setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
    toast.error(`Survey &ldquo;${survey.title}&rdquo; deleted.`);
  }

  function handleViewResults(survey: Survey) {
    setResultsSurvey(survey);
    setResultsOpen(true);
  }

  function openEdit(survey: Survey) {
    setEditSurvey(survey);
  }

  const activeSurveys = surveys.filter(
    (s) => s.status === "active" && !s.isArchived,
  );
  const pulseSurveys = surveys.filter(
    (s) => s.type === "pulse" && !s.isArchived,
  );

  if (loading && !surveys.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Surveys & Engagement
            </h1>
            <p className="text-sm text-muted-foreground">
              Create surveys, track responses, and measure employee engagement
            </p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Create Survey
        </Button>
      </div>

      <StatCards surveys={surveys} />

      <Tabs defaultValue="surveys">
        <PageTabsList
          tabs={[
            { value: "surveys", label: "All Surveys" },
            { value: "engagement", label: "Engagement Analytics" },
            { value: "pulse", label: "Pulse Surveys" },
          ]}
        />

        <TabsContent value="surveys" className="mt-4">
          <SurveysTable
            surveys={surveys.filter((s) => !s.isArchived)}
            onViewResults={handleViewResults}
            onEdit={openEdit}
            onClose={handleCloseSurvey}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="engagement" className="mt-4">
          <EngagementTrend />
        </TabsContent>

        <TabsContent value="pulse" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rose-500" />
              <p className="text-sm font-semibold text-foreground">
                Pulse Surveys ({pulseSurveys.length})
              </p>
              <p className="text-xs text-muted-foreground">
                Recurring surveys to track ongoing engagement
              </p>
            </div>

            {pulseSurveys.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pulse surveys yet.</p>
                <p className="text-xs mt-1">
                  Create a survey with type &ldquo;Pulse&rdquo; to get started.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pulseSurveys.map((s) => {
                const typeConfig = SURVEY_TYPE_CONFIG[s.type];
                const rate = getResponseRate(s);
                return (
                  <Card key={s.id} className="border-border bg-card">
                    <CardHeader className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">
                            {s.title}
                          </CardTitle>
                          <CardDescription className="text-xs truncate mt-0.5">
                            {s.description}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${typeConfig.color} ${typeConfig.bg} ${typeConfig.border} gap-1`}
                        >
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {s.pulseFrequency && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            {PULSE_FREQUENCY_LABEL[s.pulseFrequency]}
                          </span>
                        )}
                        {s.startDate && (
                          <span>
                            {s.startDate}
                            {s.endDate ? ` → ${s.endDate}` : ""}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {s.responses.length} / {s.totalTargeted} responded
                          </span>
                          <span className="font-medium">{rate}%</span>
                        </div>
                        <Progress value={rate} className="h-1.5" />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-7"
                          disabled={s.responses.length === 0}
                          onClick={() => handleViewResults(s)}
                        >
                          View Results
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs h-7"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {activeSurveys.filter((s) => s.type !== "pulse").length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Active Non-Pulse Surveys
                </p>
                <div className="space-y-2">
                  {activeSurveys
                    .filter((s) => s.type !== "pulse")
                    .map((s) => {
                      const rate = getResponseRate(s);
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.responses.length}/{s.totalTargeted} responses
                              &bull; {rate}%
                            </p>
                          </div>
                          <Progress value={rate} className="w-24 h-1.5" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 shrink-0"
                            disabled={s.responses.length === 0}
                            onClick={() => handleViewResults(s)}
                          >
                            Results
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SurveyFormModal
        open={formOpen || editSurvey !== null}
        survey={editSurvey}
        onClose={() => {
          setFormOpen(false);
          setEditSurvey(null);
        }}
        onSave={editSurvey ? handleEdit : handleCreate}
      />

      <SurveyResultsModal
        open={resultsOpen}
        survey={resultsSurvey}
        onClose={() => {
          setResultsOpen(false);
          setResultsSurvey(null);
        }}
      />
    </div>
  );
}
