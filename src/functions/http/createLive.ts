import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { response } from "../../utils/response.js";
import z from "zod";

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "../../config/env.js";
import { randomUUID } from "node:crypto";
import { dynamoClient } from "../../clients/dynamoClient.js";
import { extractFileInfo } from "../../utils/extractFileInfo.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../clients/s3Client.js";

const schema = z.object({
  title: z.string().min(1),
  number: z.number().min(0),
  fileName: z.string(),
});

export async function handler(event: APIGatewayProxyEventV2) {
  const body = JSON.parse(event.body ?? "");

  //parse would throw an exception
  const { success, data, error } = schema.safeParse(body);

  if (!success) {
    return response(400, { error: error?.issues });
  }

  const { number, title, fileName } = data;
  const { extension } = extractFileInfo(fileName);
  const thumbnailKey = `uploads/${randomUUID()}.${extension}`;

  const liveid = randomUUID();

  const putItemLiveItem = new PutCommand({
    TableName: env.LIVES_TABLE,
    Item: {
      id: liveid,
      number,
      title,
      thumbnailKey,
    },
  });

  const putObjectCommand = new PutObjectCommand({
    Bucket: env.LIVES_IMAGE_BUCKET,
    Key: thumbnailKey,
    Metadata: {
      liveid,
    },
  });

  const uploadURL = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: 600, //10 minutes this is in seconds
  });

  await dynamoClient.send(putItemLiveItem);

  //send the url to the client
  return response(201, { liveid, uploadURL });
}
