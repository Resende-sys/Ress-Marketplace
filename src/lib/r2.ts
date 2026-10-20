import "server-only";
import { AwsClient } from "aws4fetch";
import type { Bucket } from "./storage-shared";

// Acesso ao Cloudflare R2 pela API compatível com S3.
// Covers e prévias ficam no bucket público (em pastas covers/ e previews/);
// MP3/WAV/stems ficam no bucket privado e só saem por link assinado.

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 não configurado: faltam R2_ACCOUNT_ID, R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY.");
  }
  return {
    endpoint: process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`,
    publicBucket: process.env.R2_PUBLIC_BUCKET ?? "ress-public",
    privateBucket: process.env.R2_PRIVATE_BUCKET ?? "ress-masters",
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
  };
}

/** URL do objeto no R2 a partir do "tipo" de arquivo e da chave salva no banco. */
function objectUrl(bucket: Bucket, key: string) {
  const { endpoint, publicBucket, privateBucket } = config();
  const [bucketName, objectKey] =
    bucket === "masters" ? [privateBucket, key] : [publicBucket, `${bucket}/${key}`];
  const path = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${endpoint}/${bucketName}/${path}`;
}

async function presign(url: string, method: "PUT" | "GET", expiresSeconds = 3600) {
  const signed = await config().client.sign(`${url}${url.includes("?") ? "&" : "?"}X-Amz-Expires=${expiresSeconds}`, {
    method,
    aws: { signQuery: true },
  });
  return signed.url;
}

async function call(url: string, init: RequestInit) {
  const res = await config().client.fetch(url, init);
  if (!res.ok) throw new Error(`R2 respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

export function presignPut(bucket: Bucket, key: string) {
  return presign(objectUrl(bucket, key), "PUT");
}

export function presignGet(bucket: Bucket, key: string, expiresSeconds?: number) {
  return presign(objectUrl(bucket, key), "GET", expiresSeconds);
}

export async function createMultipart(bucket: Bucket, key: string, contentType?: string) {
  const res = await call(`${objectUrl(bucket, key)}?uploads`, {
    method: "POST",
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
  const uploadId = (await res.text()).match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
  if (!uploadId) throw new Error("R2 não devolveu o UploadId.");
  return uploadId;
}

export function presignPart(bucket: Bucket, key: string, uploadId: string, partNumber: number) {
  return presign(
    `${objectUrl(bucket, key)}?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`,
    "PUT",
  );
}

export async function completeMultipart(
  bucket: Bucket,
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
) {
  const body =
    "<CompleteMultipartUpload>" +
    [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${escapeXml(p.etag)}</ETag></Part>`)
      .join("") +
    "</CompleteMultipartUpload>";
  const res = await call(`${objectUrl(bucket, key)}?uploadId=${encodeURIComponent(uploadId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body,
  });
  // O S3 pode responder 200 com um erro no corpo.
  const text = await res.text();
  if (text.includes("<Error>")) throw new Error(`R2 recusou a finalização: ${text.slice(0, 300)}`);
}

export async function abortMultipart(bucket: Bucket, key: string, uploadId: string) {
  await call(`${objectUrl(bucket, key)}?uploadId=${encodeURIComponent(uploadId)}`, { method: "DELETE" });
}

export async function deleteObject(bucket: Bucket, key: string) {
  await call(objectUrl(bucket, key), { method: "DELETE" });
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
