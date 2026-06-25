import type { S3Event } from "aws-lambda";
import { getS3Object } from "../../utils/getS3Object.js";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractFileInfo } from "../../utils/extractFileInfo.js";
import { s3Client } from "../../clients/s3Client.js";
import { getS3ObjectMetadata } from "../../utils/getS3ObjectMetadata.js";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "../../config/env.js";
import { dynamoClient } from "../../clients/dynamoClient.js";

export async function handler(event: S3Event) {
  await Promise.all(
    event.Records.map(async (record) => {
      const { bucket, object } = record.s3;

      const [file, metadata] = await Promise.all([
        getS3Object({
          bucket: bucket.name,
          key: object.key,
        }),
        getS3ObjectMetadata({
          bucket: bucket.name,
          key: object.key,
        }),
      ]);

      const liveId = metadata.liveid;

      if (!liveId) {
        return;
      }

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

      const hdThumbnailKey = `processed/${fileName}_hd.webp`;
      const sdThumbnailKey = `processed/${fileName}_sd.webp`;
      const placeholderThumbnailKey = `processed/${fileName}_placeholder.webp`;

      const hdPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: hdThumbnailKey,
        Body: hdFile,
        Metadata: { liveid: liveId },
      });

      const sdPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: sdThumbnailKey,
        Body: sdImage,
        Metadata: { liveid: liveId },
      });

      const placeholderPutObject = new PutObjectCommand({
        Bucket: bucket.name,
        Key: placeholderThumbnailKey,
        Body: placeHolderImage,
        Metadata: { liveid: liveId },
      });

      const updateCommand = new UpdateCommand({
        TableName: env.LIVES_TABLE,
        Key: {
          id: liveId,
        },
        UpdateExpression:
          "set #hdThumbnailKey = :hdThumbnailKey, #sdThumbnailKey = :sdThumbnailKey, #placeholderThumbnailKey = :placeholderThumbnailKey",
        ExpressionAttributeNames: {
          "#hdThumbnailKey": "hdThumbnailKey",
          "#sdThumbnailKey": "sdThumbnailKey",
          "#placeholderThumbnailKey": "placeholderThumbnailKey",
        },
        ExpressionAttributeValues: {
          ":hdThumbnailKey": hdThumbnailKey,
          ":sdThumbnailKey": sdThumbnailKey,
          ":placeholderThumbnailKey": placeholderThumbnailKey,
        },
      });

      await Promise.all([
        dynamoClient.send(updateCommand),
        s3Client.send(hdPutObject),
        s3Client.send(sdPutObject),
        s3Client.send(placeholderPutObject),
      ]);
    }),
  );
}
