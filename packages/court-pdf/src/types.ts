export interface CourtPdfField {
  label: string;
  value: string;
  status?: string;
}

export interface CourtFormPdfInput {
  formId: string;
  label: string;
  eventCode: string;
  district: string;
  divisionName: string;
  debtorName: string;
  chapter: "7" | "13";
  fields: CourtPdfField[];
  watermark?: string;
  generatedAt?: string;
}

export interface CourtPacketPdfInput {
  district: string;
  divisionName: string;
  debtorName: string;
  chapter: "7" | "13";
  watermark?: string;
  pages: Array<{
    formId: string;
    label: string;
    eventCode: string;
    fields: CourtPdfField[];
  }>;
}
