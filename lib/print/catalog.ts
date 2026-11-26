export const PRINT_TRIMS = [
  {
    code: "a5",
    name: "A5",
    widthMm: 148,
    heightMm: 210,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "",
  },
  {
    code: "trade",
    name: "5.5 × 8.5 in",
    widthMm: 5.5 * 25.4,
    heightMm: 8.5 * 25.4,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "",
  },
  {
    code: "trade-6x9",
    name: "6 × 9 in",
    widthMm: 6 * 25.4,
    heightMm: 9 * 25.4,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "",
  },
] as const;

export const PRINT_COVERS = [
  {
    code: "hardcover",
    name: "Hardcover",
    boardMm: 2,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "Case cover. Spine width adds an allowance for boards.",
  },
  {
    code: "softcover",
    name: "Softcover",
    boardMm: 0,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "Soft cover. Spine width is the text block only.",
  },
] as const;

export const PRINT_PAPERS = [
  {
    code: "uncoated",
    name: "Standard uncoated",
    mmPerPage: 0.05,
    fill: [0.99, 0.975, 0.94] as const,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "About 80 gsm uncoated text.",
  },
  {
    code: "ivory",
    name: "Premium ivory",
    mmPerPage: 0.06,
    fill: [0.98, 0.95, 0.88] as const,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "Cream text, slightly thicker than standard uncoated.",
  },
  {
    code: "coated",
    name: "Coated photo",
    mmPerPage: 0.07,
    fill: [1, 1, 1] as const,
    partnerSku: "",
    priceCents: null,
    currency: "HKD",
    fulfillmentNote: "Smoother sheet for photographs. Thickness is an estimate.",
  },
] as const;

export type PrintTrimCode = (typeof PRINT_TRIMS)[number]["code"];
export type PrintCoverCode = (typeof PRINT_COVERS)[number]["code"];
export type PrintPaperCode = (typeof PRINT_PAPERS)[number]["code"];

export function trimByCode(code: string) {
  return PRINT_TRIMS.find((item) => item.code === code) || PRINT_TRIMS[0];
}

export function coverByCode(code: string) {
  return PRINT_COVERS.find((item) => item.code === code) || PRINT_COVERS[0];
}

export function paperByCode(code: string) {
  return PRINT_PAPERS.find((item) => item.code === code) || PRINT_PAPERS[0];
}

export function isPrintTrim(code: string): code is PrintTrimCode {
  return PRINT_TRIMS.some((item) => item.code === code);
}

export function isPrintCover(code: string): code is PrintCoverCode {
  return PRINT_COVERS.some((item) => item.code === code);
}

export function isPrintPaper(code: string): code is PrintPaperCode {
  return PRINT_PAPERS.some((item) => item.code === code);
}

/** Interior pages times the paper estimate, plus hardcover boards. Not a partner measurement. */
export function spineFor(interiorPages: number, paperCode: string, coverCode: string) {
  const paper = paperByCode(paperCode);
  const cover = coverByCode(coverCode);
  const text = Math.max(interiorPages, 1) * paper.mmPerPage;
  return Math.round((text + cover.boardMm) * 10) / 10;
}

export type PrintSelection = {
  trim: PrintTrimCode;
  cover: PrintCoverCode;
  paper: PrintPaperCode;
};

/** Hook for a later printer. No partner is called, and no price is invented. */
export function preparePrintCheckout(selection: PrintSelection) {
  const trim = trimByCode(selection.trim);
  const cover = coverByCode(selection.cover);
  const paper = paperByCode(selection.paper);
  return {
    ready: false as const,
    reason: "print-partner-not-connected" as const,
    selection: { trim: trim.code, cover: cover.code, paper: paper.code },
    partnerSku: "",
    amountCents: null as number | null,
    currency: "HKD",
    fulfillmentNote: [trim.fulfillmentNote, cover.fulfillmentNote, paper.fulfillmentNote].filter(Boolean).join(" "),
  };
}
