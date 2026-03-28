import type { CaseRecord } from "../types/domain";

/** Fresh case templates — no facts, no criteria, no recommendation. AI pipeline fills these. */
export const PATIENT_TEMPLATES: Array<{
  id: string;
  label: string;
  description: string;
  case: CaseRecord;
}> = [
  {
    id: "case-mri-spine",
    label: "Lumbar MRI",
    description: "Maya Patel, 46 — Low back pain with radiculopathy, requesting lumbar spine MRI",
    case: {
      id: "case-mri-spine",
      status: "intake",
      patient: {
        id: "patient-001",
        name: "Maya Patel",
        age: 46,
        payer: "Aetna",
        memberId: "AE44920177",
        diagnosis: ["M54.16", "M54.50"],
        medications: ["Ibuprofen", "Naproxen"],
        history: ["Low back pain for 8 weeks", "Radiculopathy", "Home exercise program attempted"],
      },
      requestedService: {
        id: "svc-001",
        label: "Lumbar spine MRI without contrast",
        cptCode: "72148",
        icd10Codes: ["M54.16", "M54.50"],
        rationale: "Evaluate persistent radicular symptoms and worsening neurologic findings.",
      },
      documents: [
        { id: "doc-clinical-note", kind: "clinical_note", title: "Clinical note", fileName: "clinical_note.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-payer-policy", kind: "payer_policy", title: "Payer policy", fileName: "aetna_lumbar_mri_policy.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-lab", kind: "lab", title: "Labs", fileName: "cbc_cmp_results.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-form", kind: "form", title: "Request form", fileName: "mri_prior_auth_form.pdf", uploadedAt: new Date().toISOString() },
      ],
      facts: [],
      criteria: [],
      recommendation: { status: "incomplete", confidence: 0, summary: "Awaiting AI analysis.", missingItems: [] },
      packet: { status: "not_ready", formName: "Lumbar MRI Prior Authorization", attachments: [] },
      transcript: [],
      auditLog: [{ id: "audit-1", at: new Date().toISOString(), actor: "system", title: "Case created", detail: "New prior authorization case initiated." }],
      voiceCalls: [],
    },
  },
  {
    id: "case-ct-coronary",
    label: "CT Coronary Angiography",
    description: "Jordan Lee, 62 — Exertional chest pain with abnormal stress test, requesting CT angiography",
    case: {
      id: "case-ct-coronary",
      status: "intake",
      patient: {
        id: "patient-002",
        name: "Jordan Lee",
        age: 62,
        payer: "Blue Shield",
        memberId: "BS90117355",
        diagnosis: ["I20.9", "R06.02"],
        medications: ["Metoprolol", "Rosuvastatin", "Aspirin"],
        history: ["Exertional chest pressure for 3 months", "Abnormal stress test", "Shortness of breath with stairs"],
      },
      requestedService: {
        id: "svc-002",
        label: "CT coronary angiography",
        cptCode: "75574",
        icd10Codes: ["I20.9", "R06.02"],
        rationale: "Clarify coronary anatomy after abnormal stress test and progressive exertional symptoms.",
      },
      documents: [
        { id: "doc-clinical-note", kind: "clinical_note", title: "Cardiology note", fileName: "cardiology_followup.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-payer-policy", kind: "payer_policy", title: "Payer policy", fileName: "blueshield_cta_policy.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-lab", kind: "lab", title: "Stress test", fileName: "abnormal_stress_test.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-form", kind: "form", title: "Auth form", fileName: "cta_intake_form.pdf", uploadedAt: new Date().toISOString() },
      ],
      facts: [],
      criteria: [],
      recommendation: { status: "incomplete", confidence: 0, summary: "Awaiting AI analysis.", missingItems: [] },
      packet: { status: "not_ready", formName: "CT Coronary Angiography Authorization", attachments: [] },
      transcript: [],
      auditLog: [{ id: "audit-1", at: new Date().toISOString(), actor: "system", title: "Case created", detail: "New prior authorization case initiated." }],
      voiceCalls: [],
    },
  },
  {
    id: "case-knee-surgery",
    label: "Knee Arthroscopy",
    description: "Sarah Chen, 34 — ACL tear from sports injury, requesting knee arthroscopy",
    case: {
      id: "case-knee-surgery",
      status: "intake",
      patient: {
        id: "patient-003",
        name: "Sarah Chen",
        age: 34,
        payer: "UnitedHealthcare",
        memberId: "UH78234510",
        diagnosis: ["S83.511A", "M23.611"],
        medications: ["Acetaminophen", "Meloxicam"],
        history: ["ACL tear from soccer injury 4 weeks ago", "Failed conservative treatment with brace", "Unable to return to work"],
      },
      requestedService: {
        id: "svc-003",
        label: "Knee arthroscopy with ACL reconstruction",
        cptCode: "29888",
        icd10Codes: ["S83.511A", "M23.611"],
        rationale: "Anterior cruciate ligament reconstruction required for mechanical instability after failed conservative management.",
      },
      documents: [
        { id: "doc-clinical-note", kind: "clinical_note", title: "Orthopedic note", fileName: "ortho_evaluation.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-payer-policy", kind: "payer_policy", title: "Payer policy", fileName: "uhc_knee_surgery_policy.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-lab", kind: "lab", title: "MRI report", fileName: "knee_mri_report.pdf", uploadedAt: new Date().toISOString() },
        { id: "doc-form", kind: "form", title: "Surgery request", fileName: "surgery_auth_form.pdf", uploadedAt: new Date().toISOString() },
      ],
      facts: [],
      criteria: [],
      recommendation: { status: "incomplete", confidence: 0, summary: "Awaiting AI analysis.", missingItems: [] },
      packet: { status: "not_ready", formName: "Knee Arthroscopy Authorization", attachments: [] },
      transcript: [],
      auditLog: [{ id: "audit-1", at: new Date().toISOString(), actor: "system", title: "Case created", detail: "New prior authorization case initiated." }],
      voiceCalls: [],
    },
  },
];
