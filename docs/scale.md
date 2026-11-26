# Database and file storage

The current deploy is one Node server, a SQLite file, and photographs and recordings on that server's disk. Keep that. This change does not move the production database.

The app talks to data through Prisma and through `storagePut`, `storageGet`, and `storageDelete`. There is no SQLite-specific SQL in the application code.

## Postgres, later

When more than one process needs to write, change the Prisma datasource provider from `sqlite` to `postgresql`, point `DATABASE_URL` at the new database, and run `npx prisma db push` against that empty database. Do not aim a SQLite file URL at Postgres, and do not run that change against the live family database as part of a routine deploy. `databaseKind` in `lib/runtime.ts` is how the process can tell the two URLs apart.

## Object storage, when you want it

`STORAGE_DRIVER=local` stays the default and writes under `data/uploads`. `STORAGE_DRIVER=s3` already speaks the S3 API, including a custom `S3_ENDPOINT` for DigitalOcean Spaces, Aliyun OSS, Tencent COS, or MinIO. Keep the bucket private. The site serves a photograph or a recording only through `/api/media/...` after checking that it belongs to the signed-in account. Exports put those bytes inside a zip the account downloads. They do not publish a public object URL.
