import type { CaseRecord } from "../types/domain";

const now = "2026-03-28T14:30:00.000Z";

const mockCases: CaseRecord[] = [
  {
    id: "case-demo-001",
    status: "needs-info",
    patient: {
      id: "patient-001",
      name: "Maya Patel",
      age: 46,
      payer: "Aetna",
      memberId: "AE44920177",
      diagnosis: ["M54.16", "M54.50"],
      medications: ["Ibuprofen", "Naproxen"],
      history: ["Low back pain for 8 weeks", "Radiculopathy", "Home exercise program attempted"]
    },
    requestedService: {
      id: "svc-001",
      label: "Lumbar spine MRI without contrast",
      cptCode: "72148",
      icd10Codes: ["M54.16", "M54.50"],
      rationale: "Evaluate persistent radicular symptoms and worsening neurologic findings."
    },
    documents: [
      {
        id: "doc-clinical-note",
        kind: "clinical_note",
        title: "Clinical note",
        fileName: "mock_clinical_note.pdf",
        uploadedAt: now
      },
      {
        id: "doc-payer-policy",
        kind: "payer_policy",
        title: "Payer policy",
        fileName: "aetna_lumbar_mri_policy.pdf",
        uploadedAt: now
      },
      {
        id: "doc-lab",
        kind: "lab",
        title: "Labs",
        fileName: "cbc_cmp_results.pdf",
        uploadedAt: now
      },
      {
        id: "doc-form",
        kind: "form",
        title: "Request form",
        fileName: "mri_prior_auth_form.pdf",
        uploadedAt: now
      }
    ],
    facts: [
      {
        id: "fact-1",
        label: "Low back pain with radiculopathy lasting 8 weeks",
        evidenceDocId: "doc-clinical-note",
        evidenceQuote: "Persistent lumbar pain radiating down left leg for 8 weeks.",
        sourceLabel: "Clinical note"
      },
      {
        id: "fact-2",
        label: "NSAID trial documented without adequate response",
        evidenceDocId: "doc-clinical-note",
        sourceLabel: "Medication history"
      },
      {
        id: "fact-3",
        label: "Home exercise program attempted",
        evidenceDocId: "doc-clinical-note",
        sourceLabel: "Progress note"
      },
      {
        id: "fact-4",
        label: "Neurologic symptoms worsening with leg numbness",
        evidenceDocId: "doc-clinical-note",
        sourceLabel: "Exam finding"
      }
    ],
    criteria: [
      {
        id: "criterion-1",
        clauseTitle: "Persistent symptoms",
        clauseText: "Symptoms must persist for at least 6 weeks.",
        status: "matched",
        evidenceFactIds: ["fact-1"]
      },
      {
        id: "criterion-2",
        clauseTitle: "Conservative therapy",
        clauseText: "Conservative treatment must be attempted first.",
        status: "matched",
        evidenceFactIds: ["fact-2", "fact-3"]
      },
      {
        id: "criterion-3",
        clauseTitle: "Neurologic deficit",
        clauseText: "Advanced imaging is supported by radicular symptoms or neurologic findings.",
        status: "matched",
        evidenceFactIds: ["fact-4"]
      },
      {
        id: "criterion-4",
        clauseTitle: "Medical necessity",
        clauseText: "Requested study must be medically necessary for next-step management.",
        status: "matched",
        evidenceFactIds: ["fact-1", "fact-4"]
      },
      {
        id: "criterion-5",
        clauseTitle: "Supervised PT failure",
        clauseText: "Policy requires explicit supervised PT failure documentation.",
        status: "missing",
        evidenceFactIds: [],
        missingReason: "No explicit note confirming failed supervised PT for 6 weeks."
      }
    ],
    recommendation: {
      status: "incomplete",
      confidence: 86,
      summary:
        "The request is likely approvable once failed supervised physical therapy is documented explicitly.",
      missingItems: ["Document supervised PT failure for 6 weeks."]
    },
    packet: {
      status: "not_ready",
      formName: "Lumbar MRI Prior Authorization Packet",
      attachments: ["Clinical note", "Payer policy excerpts", "Lab summary", "Prior auth form"]
    },
    transcript: [
      {
        id: "tx-1",
        at: now,
        speaker: "system",
        text: "Case ingested. Structured patient facts and payer criteria are ready for review."
      }
    ],
    auditLog: [
      {
        id: "audit-1",
        at: now,
        actor: "system",
        title: "Intake completed",
        detail: "Clinical note, policy, lab, and intake form were indexed into the case."
      },
      {
        id: "audit-2",
        at: now,
        actor: "extraction_agent",
        title: "Extraction agent",
        detail: "Mapped symptoms, prior treatment, and requested imaging into structured fields."
      },
      {
        id: "audit-3",
        at: now,
        actor: "policy_agent",
        title: "Policy match generated",
        detail: "Matched 4 of 5 policy clauses. One documentation gap detected."
      }
    ],
    voiceCalls: []
  },
  {
    id: "case-demo-002",
    status: "ready",
    patient: {
      id: "patient-002",
      name: "Jordan Lee",
      age: 62,
      payer: "Blue Shield",
      memberId: "BS90117355",
      diagnosis: ["I20.9", "R06.02"],
      medications: ["Metoprolol", "Rosuvastatin", "Aspirin"],
      history: ["Exertional chest pressure for 3 months", "Abnormal stress test", "Shortness of breath with stairs"]
    },
    requestedService: {
      id: "svc-002",
      label: "CT coronary angiography",
      cptCode: "75574",
      icd10Codes: ["I20.9", "R06.02"],
      rationale: "Clarify coronary anatomy after an abnormal stress test and progressive exertional symptoms."
    },
    documents: [
      {
        id: "doc2-clinical-note",
        kind: "clinical_note",
        title: "Cardiology note",
        fileName: "cardiology_followup_note.pdf",
        uploadedAt: now
      },
      {
        id: "doc2-payer-policy",
        kind: "payer_policy",
        title: "Payer policy",
        fileName: "blueshield_cta_policy.pdf",
        uploadedAt: now
      },
      {
        id: "doc2-lab",
        kind: "lab",
        title: "Stress test report",
        fileName: "abnormal_stress_test.pdf",
        uploadedAt: now
      },
      {
        id: "doc2-form",
        kind: "form",
        title: "Prior auth worksheet",
        fileName: "cta_intake_form.pdf",
        uploadedAt: now
      }
    ],
    facts: [
      {
        id: "fact2-1",
        label: "Progressive exertional chest pain",
        evidenceDocId: "doc2-clinical-note",
        evidenceQuote: "Chest pressure occurs after one flight of stairs and is increasing in frequency.",
        sourceLabel: "Cardiology note"
      },
      {
        id: "fact2-2",
        label: "Abnormal stress imaging",
        evidenceDocId: "doc2-lab",
        sourceLabel: "Stress test report"
      },
      {
        id: "fact2-3",
        label: "Medical therapy already started",
        evidenceDocId: "doc2-clinical-note",
        sourceLabel: "Medication list"
      }
    ],
    criteria: [
      {
        id: "criterion2-1",
        clauseTitle: "Symptomatic patient",
        clauseText: "Patient has symptoms concerning for obstructive coronary disease.",
        status: "matched",
        evidenceFactIds: ["fact2-1"]
      },
      {
        id: "criterion2-2",
        clauseTitle: "Abnormal antecedent testing",
        clauseText: "Prior noninvasive testing supports further anatomic evaluation.",
        status: "matched",
        evidenceFactIds: ["fact2-2"]
      },
      {
        id: "criterion2-3",
        clauseTitle: "Initial medical management documented",
        clauseText: "Medication therapy or risk reduction steps are documented.",
        status: "matched",
        evidenceFactIds: ["fact2-3"]
      }
    ],
    recommendation: {
      status: "likely_approve",
      confidence: 94,
      summary: "Criteria are satisfied and the packet is ready for human approval.",
      missingItems: []
    },
    packet: {
      status: "drafted",
      formName: "CT Coronary Angiography Packet",
      attachments: ["Cardiology note", "Abnormal stress test report", "Policy excerpt"],
      generatedAt: now
    },
    transcript: [
      {
        id: "tx2-1",
        at: now,
        speaker: "system",
        text: "Ready case loaded. All structured findings are available for approval review."
      }
    ],
    auditLog: [
      {
        id: "audit2-1",
        at: now,
        actor: "system",
        title: "Intake completed",
        detail: "Cardiology note, abnormal stress test, and payer policy were indexed."
      },
      {
        id: "audit2-2",
        at: now,
        actor: "policy_agent",
        title: "Criteria satisfied",
        detail: "All policy requirements are met and the packet was drafted."
      }
    ],
    voiceCalls: []
  }
];

export function createInitialCase(): CaseRecord {
  return cloneCase(mockCases[0]);
}

export function createMockCaseById(caseId: string): CaseRecord {
  const match = mockCases.find((entry) => entry.id === caseId) ?? mockCases[0];
  return cloneCase(match);
}

export function createNextMockCase(currentCaseId: string): CaseRecord {
  const currentIndex = mockCases.findIndex((entry) => entry.id === currentCaseId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % mockCases.length;
  return cloneCase(mockCases[nextIndex]);
}

function cloneCase(caseRecord: CaseRecord): CaseRecord {
  return {
    ...caseRecord,
    patient: { ...caseRecord.patient },
    requestedService: { ...caseRecord.requestedService, icd10Codes: [...caseRecord.requestedService.icd10Codes] },
    documents: caseRecord.documents.map((document) => ({ ...document })),
    facts: caseRecord.facts.map((fact) => ({ ...fact })),
    criteria: caseRecord.criteria.map((criterion) => ({ ...criterion, evidenceFactIds: [...criterion.evidenceFactIds] })),
    recommendation: {
      ...caseRecord.recommendation,
      missingItems: [...caseRecord.recommendation.missingItems]
    },
    packet: {
      ...caseRecord.packet,
      attachments: [...caseRecord.packet.attachments]
    },
    transcript: caseRecord.transcript.map((entry) => ({ ...entry })),
    auditLog: caseRecord.auditLog.map((event) => ({ ...event })),
    voiceCalls: caseRecord.voiceCalls.map((call) => ({ ...call }))
  };
}
