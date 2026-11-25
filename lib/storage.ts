import { promises as fs } from "fs";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const localRoot = path.join(process.cwd(), "data", "uploads");

function safeKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error("invalid storage key");
  }
  return normalized;
}

async function putLocal(key: string, body: Buffer) {
  const full = path.join(localRoot, safeKey(key));
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
}

async function getLocal(key: string) {
  const full = path.join(localRoot, safeKey(key));
  try {
    const body = await fs.readFile(full);
    return body;
  } catch {
    return null;
  }
}

async function deleteLocal(key: string) {
  const full = path.join(localRoot, safeKey(key));
  await fs.rm(full, { force: true });
}

function s3() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });
}

function bucket() {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3");
  return name;
}

export async function storagePut(key: string, body: Buffer, contentType: string) {
  if ((process.env.STORAGE_DRIVER || "local") === "s3") {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: safeKey(key),
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }
  await putLocal(key, body);
}

export async function storageGet(key: string) {
  if ((process.env.STORAGE_DRIVER || "local") === "s3") {
    try {
      const result = await s3().send(
        new GetObjectCommand({ Bucket: bucket(), Key: safeKey(key) }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return null;
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }
  return getLocal(key);
}

export async function storageDelete(key: string) {
  if (!key) return;
  if ((process.env.STORAGE_DRIVER || "local") === "s3") {
    await s3().send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: safeKey(key) }),
    );
    return;
  }
  await deleteLocal(key);
}
