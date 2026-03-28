import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { applyCaseAction, fetchDemoCase, fetchVoiceStatus, parseVoiceCommand, startVoiceCall, submitCase, uploadIntakeDocument } from "./api";
import { createInitialCase } from "../lib/mockData";
import { getDashboardMetrics } from "../lib/selectors";
import type { AppAction } from "../types/actions";
import type { CaseRecord } from "../types/domain";

export function useCaseController() {
  const [caseRecord, setCaseRecord] = useState<CaseRecord>(createInitialCase);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const caseQuery = useQuery({
    queryKey: ["demo-case"],
    queryFn: fetchDemoCase,
    retry: false
  });

  const activeCase = caseQuery.data?.caseRecord ?? caseRecord;

  const voiceStatusQuery = useQuery({
    queryKey: ["voice-status", activeCase.id],
    queryFn: () => fetchVoiceStatus(activeCase.id),
    retry: false
  });

  const uploadMutation = useMutation({
    mutationFn: uploadIntakeDocument
  });

  const caseActionMutation = useMutation({
    mutationFn: applyCaseAction
  });

  const voiceMutation = useMutation({
    mutationFn: ({ text, caseId }: { text: string; caseId?: string }) => parseVoiceCommand(text, caseId)
  });

  const callMutation = useMutation({
    mutationFn: startVoiceCall
  });

  const submitMutation = useMutation({
    mutationFn: submitCase
  });

  const metrics = useMemo(() => getDashboardMetrics(activeCase), [activeCase]);

  function hydrate(nextCase: CaseRecord) {
    setCaseRecord(nextCase);
    return nextCase;
  }

  async function runAction(action: AppAction) {
    setSubmissionError(null);

    if (action.type === "RUN_DEMO_FLOW") {
      const resolved = await caseActionMutation.mutateAsync({
        caseId: activeCase.id,
        action: {
          type: "RESOLVE_MISSING_ITEM",
          payload: {
            note: "Supervised PT failure documented for 6 weeks.",
            source: "demo"
          }
        }
      });
      hydrate(resolved.caseRecord);
      const submitted = await submitMutation.mutateAsync({ caseId: activeCase.id });
      hydrate(submitted.caseRecord);
      return;
    }

    if (action.type === "UPLOAD_DOCUMENT") {
      const result = await uploadMutation.mutateAsync({
        caseId: activeCase.id,
        ...action.payload
      });
      hydrate(result.caseRecord);
      return;
    }

    if (action.type === "VOICE_COMMAND_RECEIVED") {
      const result = await voiceMutation.mutateAsync({
        text: action.payload.rawText,
        caseId: activeCase.id
      });
      hydrate(result.caseRecord);
      return;
    }

    if (action.type === "APPROVE_SUBMIT") {
      try {
        const result = await submitMutation.mutateAsync({ caseId: activeCase.id });
        hydrate(result.caseRecord);
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : "Submission failed.");
        throw error;
      }
      return;
    }

    const result = await caseActionMutation.mutateAsync({
      caseId: activeCase.id,
      action
    });
    hydrate(result.caseRecord);
  }

  async function placeVoiceCall(phoneNumber: string) {
    const result = await callMutation.mutateAsync({
      caseId: activeCase.id,
      phoneNumber
    });
    hydrate(result.caseRecord);
    return result;
  }

  return {
    caseRecord: activeCase,
    metrics,
    runAction,
    placeVoiceCall,
    isBootstrapping: caseQuery.isLoading && !caseQuery.data,
    hasBootstrapError: caseQuery.isError,
    backendOnline: !caseQuery.isError,
    isUploading: uploadMutation.isPending,
    isListening: voiceMutation.isPending,
    isSubmitting: submitMutation.isPending,
    submissionError,
    voiceStatus: voiceStatusQuery.data,
    isVoiceCalling: callMutation.isPending,
    lastVoiceCall: activeCase.voiceCalls[0]
  };
}
