import { complycoApiRequest, type UseValidAuth} from "@complyco/client-core";

export type LoadedEvidence = {
  startTime: Date;
  numPages: number;
  pdfHeight: number;
  url: string;
  screenSize: string;
};

export type ScrolledEvidence = {
  pixelsScrolled: number;
};

export type SignedEvidence = {
  signatureImage: string;
  typedText?: string;
  numStrokes?: number;
  dimensions: string;
};

export type ClickedEvidence = {
  text: string;
  ccRole: string;
};

export type ConsentEvidence = {
  predicate?: string;
  text?: string;
  loaded?: LoadedEvidence;
  scrolled?: ScrolledEvidence;
  signed?: SignedEvidence;
  clicked?: ClickedEvidence;
};

export type Transition = {
  source: string;
  target: string;
  action: string;
  occurred_at: Date;
  evidence: ConsentEvidence | undefined;
};

export type PostConsentTransitionsRequestBody = {
  id: string;
  transitions: Transition[];
};

export type PostConsentTransitionsResponseBody = {
  message: string;
  data: {
    // TODO: make these enums
    state: string;
    action: string;
  };
};

export async function postConsentTransitions({
  body,
  getApiConfig,
  signal,
}: {
  body: PostConsentTransitionsRequestBody;
  getApiConfig: UseValidAuth;
  signal?: AbortSignal;
}) {

  const result = await complycoApiRequest(getApiConfig, `/api/v1/document_consents/${body.id}/transitions`, {
    transitions: body.transitions,
  });
  return result.data;
}
