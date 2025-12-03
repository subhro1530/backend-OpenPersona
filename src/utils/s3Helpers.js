import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { VULTR_BUCKET } from "../config/storage.js";

export const uploadFile = async (buffer, contentType, key) => {
  const command = new PutObjectCommand({
    Bucket: VULTR_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  });
  await s3Client.send(command);
  return key;
};

export const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({ Bucket: VULTR_BUCKET, Key: key });
  await s3Client.send(command);
  return true;
};

export const generateSignedUrl = async (key, expiresInSeconds = 900) => {
  const command = new GetObjectCommand({ Bucket: VULTR_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

export const getObjectBuffer = async (key) => {
  const command = new GetObjectCommand({ Bucket: VULTR_BUCKET, Key: key });
  const response = await s3Client.send(command);
  if (!response.Body) return Buffer.from([]);

  if (typeof response.Body.transformToByteArray === "function") {
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};
