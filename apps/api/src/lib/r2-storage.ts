import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

function getR2Client(): S3Client {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  const config: S3ClientConfig = {
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  };
  client = new S3Client(config);
  return client;
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME!.trim();
}

export async function putR2Object(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getR2Object(
  storageKey: string
): Promise<{ body: Buffer; contentType: string }> {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: storageKey,
    })
  );
  if (!response.Body) {
    throw new Error("Empty object body");
  }
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  return {
    body: bytes,
    contentType: response.ContentType ?? "application/octet-stream",
  };
}
