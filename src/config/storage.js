import "./env.js";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const required = [
  "VULTR_ENDPOINT",
  "VULTR_ACCESS_KEY",
  "VULTR_SECRET_KEY",
  "VULTR_BUCKET_NAME",
];
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(
      `${key} is not set. Please verify your environment variables.`
    );
  }
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.VULTR_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VULTR_ACCESS_KEY,
    secretAccessKey: process.env.VULTR_SECRET_KEY,
  },
  forcePathStyle: false,
});

export const VULTR_BUCKET = process.env.VULTR_BUCKET_NAME;
export const verifyVultrConnection = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: VULTR_BUCKET }));
    console.log("[Storage] Vultr bucket connection verified.");
  } catch (error) {
    console.error(
      "[Storage] Unable to connect to Vultr bucket:",
      error.message
    );
    throw error;
  }
};

export default s3Client;
