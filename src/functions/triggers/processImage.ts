import type { S3Event } from "aws-lambda";
import { getS3Object } from "../../utils/getS3Object.js";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractFileInfo } from "../../utils/extractFileInfo.js";
import { s3Client } from "../../clients/s3Client.js";

export async function handler(event: S3Event) {
  await Promise.all(
    event.Records.map(async (record) => {
      const { bucket, object } = record.s3;

      const file = await getS3Object({
        bucket: bucket.name,
        key: object.key,
      });

      const [hdFile, sdImage, placeHolderImage] = await Promise.all([
        sharp(file)
          .resize({
            width: 1280,
            height: 720,
            fit: "contain",
            background: "#000",
          })
          .toFormat("webp", { quality: 80 })
          .toBuffer(),
        sharp(file)
          .resize({
            width: 640,
            height: 360,
            fit: "contain",
            background: "#000",
          })
          .toFormat("webp", { quality: 80 })
          .toBuffer(),
        sharp(file)
          .resize({
            width: 124,
            height: 70,
            fit: "contain",
            background: "#000",
          })
          .toFormat("webp", { quality: 80 })
          .blur(5)
          .toBuffer(),
      ]);

      //imageId.png
      //imageId_hd.png
      //imageId_sd.png
      //imageId_placeholder.png

      const { fileName } = extractFileInfo(object.key);

      const hdThumbnailKey = `processed/${fileName}.webp`;
      const sdThumbnailKey = `processed/${fileName}.webp`;
      const placeholderThumbnailKey = `processed/${fileName}.webp`;

      const hdPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: hdThumbnailKey,
        Body: hdFile,
      });

      const sdPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: sdThumbnailKey,
        Body: sdImage,
      });

      const placeholderPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: placeholderThumbnailKey,
        Body: placeHolderImage,
      });

      await Promise.all([
        s3Client.send(hdPutObject),
        s3Client.send(sdPutObject),
        s3Client.send(placeholderPutObject),
      ]);
    }),
  );
}
