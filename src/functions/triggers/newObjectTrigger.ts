import {
  SendMessageBatchCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import { randomUUID } from "crypto";
import { object, record } from "zod";
import { sqsClient } from "../../clients/sqsClient.js";
import { env } from "../../config/env.js";

export async function handler(event: S3Event) {
  //Create chunks, multiple batch with at most 10 items, to do
  const sendMessageBatchCommand = new SendMessageBatchCommand({
    QueueUrl: env.IMAGE_PROCESSING_QUEUE_URL,
    Entries: event.Records.map((record) => ({
      Id: randomUUID(),
      MessageBody: JSON.stringify({
        bucket: record.s3.bucket,
        key: record.s3.object.key,
      }),
    })),
  });

  await sqsClient.send(sendMessageBatchCommand);
}
