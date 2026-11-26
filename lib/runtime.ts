/** How this process would store accounts. The schema stays SQLite until a later move. */
export function databaseKind(url = process.env.DATABASE_URL || "") {
  if (!url || url.startsWith("file:") || url.startsWith("sqlite:")) return "sqlite" as const;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return "postgres" as const;
  return "other" as const;
}

/** Local disk, or any S3-compatible bucket (Spaces, OSS, COS, MinIO). */
export function storageKind(driver = process.env.STORAGE_DRIVER || "local") {
  if (driver === "s3") {
    return { driver: "s3" as const, endpoint: process.env.S3_ENDPOINT || "" };
  }
  return { driver: "local" as const, endpoint: "" };
}
