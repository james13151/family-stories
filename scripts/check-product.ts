import { inflateRawSync } from "zlib";
import { accountStoryWhere, assertOneAccount } from "../lib/account";
import { billingStatus, familyCheckoutRequest, planAllows } from "../lib/billing/plans";
import { buildArchive, buildStoryCsv, buildStoryTxt, fileSlug } from "../lib/export/stories";
import { preparePrintCheckout, PRINT_COVERS, PRINT_PAPERS, PRINT_TRIMS } from "../lib/print/catalog";
import { databaseKind, storageKind } from "../lib/runtime";

const errors: string[] = [];

const codes = [
  ...PRINT_TRIMS.map((item) => item.code),
  ...PRINT_COVERS.map((item) => item.code),
  ...PRINT_PAPERS.map((item) => item.code),
];
if (new Set(codes).size !== codes.length) errors.push("print catalog codes are not unique");
for (const item of [...PRINT_TRIMS, ...PRINT_COVERS, ...PRINT_PAPERS]) {
  if (item.partnerSku !== "" || item.priceCents !== null) errors.push(`catalog item ${item.code} invented a price or sku`);
}

const quote = preparePrintCheckout({ trim: "a5", cover: "hardcover", paper: "ivory" });
if (quote.ready || quote.partnerSku || quote.amountCents !== null) errors.push("print checkout must stay disconnected");
if (quote.selection.paper !== "ivory") errors.push("print selection was not kept");

if (!planAllows("gift", "exports") || !planAllows("gift", "print-file") || !planAllows("gift", "memoir")) {
  errors.push("gift plan must keep the current product open");
}
if (planAllows("gift", "print-checkout")) errors.push("gift plan should not include print checkout");
if (!planAllows("family", "print-checkout")) errors.push("family plan should reserve print checkout");
if (!planAllows("mystery", "booklets")) errors.push("an unknown plan must fall back to gift, not a lockout");
if (billingStatus().enabled) errors.push("billing is enabled in this environment");

process.env.STRIPE_BILLING_ENABLED = "true";
process.env.STRIPE_SECRET_KEY = "sk_test_example";
process.env.STRIPE_PRICE_FAMILY = "price_example";
const request = familyCheckoutRequest({ id: "user-a", email: "a@example.com" }, "https://stories.example.com");
if (!request.ready || !request.body.includes("mode=subscription") || !request.body.includes("user-a") || !request.body.includes("price_example")) {
  errors.push("stripe request body was not ready to send later");
}
delete process.env.STRIPE_BILLING_ENABLED;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_PRICE_FAMILY;
if (billingStatus().enabled) errors.push("billing stayed enabled after the test");

if (databaseKind("file:../data/hearthlight.db") !== "sqlite") errors.push("sqlite url not recognized");
if (databaseKind("postgresql://localhost/hearthlight") !== "postgres") errors.push("postgres url not recognized");
if (storageKind("local").driver !== "local" || storageKind("s3").driver !== "s3") errors.push("storage driver not recognized");

try {
  accountStoryWhere("");
  errors.push("empty account id was accepted");
} catch {
  /* expected */
}
if (accountStoryWhere("user-a").userId === accountStoryWhere("user-b").userId) errors.push("account filters collided");

const rows = [
  {
    userId: "user-a",
    id: "story-1",
    createdAt: "2020-01-02T00:00:00.000Z",
    updatedAt: "2020-01-03T00:00:00.000Z",
    kind: "life",
    childName: "",
    theme: "family",
    stage: "childhood",
    place: "home",
    title: "西關的早晨",
    question: "街上是什麼聲音？",
    body: "街市很熱鬧。\n她說：「早。」",
    transcript: "简体一句：街市很热闹。",
    inBook: true,
  },
  {
    userId: "user-a",
    id: "story-2",
    createdAt: "2021-05-01T00:00:00.000Z",
    updatedAt: "2021-05-01T00:00:00.000Z",
    kind: "child",
    childName: "美玲",
    theme: "school",
    stage: "school-years",
    place: "",
    title: "Sunday",
    question: "What did you eat?",
    body: "Congee, rice, and \"noodles\".",
    transcript: "",
    inBook: false,
  },
];

const csv = buildStoryCsv("user-a", rows);
if (!csv.startsWith("\uFEFF")) errors.push("csv missing utf-8 bom");
if (!csv.includes("id,created_at,updated_at,kind,child_name,theme,stage,place,title,question,body,transcript,in_book")) {
  errors.push("csv columns changed");
}
if (!csv.includes("西關的早晨") || !csv.includes("简体一句：街市很热闹。")) errors.push("csv dropped Chinese");
if (!csv.includes("\"Congee, rice, and \"\"noodles\"\".\"")) errors.push("csv quoting failed");
const txt = buildStoryTxt("user-a", "陳美玲", rows);
if (!txt.includes("街市很熱鬧") || !txt.includes("简体一句")) errors.push("txt dropped Chinese");
if (fileSlug("西關的早晨", "abcdef123456") !== "西關的早晨-123456") errors.push(`slug ${fileSlug("西關的早晨", "abcdef123456")}`);

let mixed = false;
try {
  assertOneAccount([{ userId: "user-a" }, { userId: "user-b" }], "user-a");
} catch {
  mixed = true;
}
if (!mixed) errors.push("mixed accounts were accepted");

const zip = buildArchive("user-a", "陳美玲", rows, [
  { storyId: "story-1", kind: "photo", id: "photo-1", mimeType: "image/png", caption: "門口", bytes: Buffer.from("png") },
  { storyId: "story-1", kind: "audio", id: "audio-1", mimeType: "audio/wav", caption: "", bytes: Buffer.from("wav") },
]);
const files = unzip(zip);
const manifest = files.get("manifest.json")?.toString("utf8") || "";
if (/https?:\/\//.test(manifest)) errors.push("manifest contained a url");
if (!manifest.includes("西關的早晨") || !manifest.includes("photos/")) errors.push("manifest missing the family file");
const csvFile = files.get("stories.csv")?.toString("utf8") || "";
if (!csvFile.includes("街市很熱鬧")) errors.push("zip csv dropped traditional Chinese");
const photoName = [...files.keys()].find((name) => name.startsWith("photos/"));
if (!photoName || !photoName.includes("西關的早晨")) errors.push(`photo filename ${photoName}`);
if (![...files.keys()].some((name) => name.startsWith("audio/") && name.endsWith(".wav"))) errors.push("audio missing from archive");

function unzip(buffer: Buffer) {
  const out = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 8);
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extra = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const start = offset + 30 + nameLength + extra;
    const data = buffer.subarray(start, start + size);
    out.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data));
    offset = start + size;
  }
  return out;
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Exports, print catalog, plans, and storage targets OK");
