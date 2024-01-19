import { NextFunction, Response, Request } from "express";
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import EnvConfig from "../envConfig";
import { BadRequestException } from "../lib/utils";

const MODERATION_FILTER = [
    "Explicit",
    "Explicit Nudity",
    "Exposed Male Genitalia",
    "Exposed Female Genitalia",
    "Exposed Buttocks or Anus",
    "Exposed Female Nipple",
    "Sex Toys",
    "Explicit Sexual Activity",
    "Sex Toys",
    "Visually Disturbing",
    "Death and Emaciation",
    "Crashes"
]

const ImageDetection = async (req: Request, res: Response, next: NextFunction) => {
    const client = new RekognitionClient({
        region: EnvConfig.getAwsRegion(),
        credentials: {
            accessKeyId: EnvConfig.getAwsAccessKey(),
            secretAccessKey: EnvConfig.getAwsSecretAccessKey()
        }
    });

    const params = {
        Image: {
            Bytes: req.file.buffer
        },
        MinConfidence: 50
    };

    const command = new DetectModerationLabelsCommand(params)
    const data = await client.send(command)
    const moderationFilterCheck = data.ModerationLabels.some((item) => MODERATION_FILTER.includes(item.Name))

    if (moderationFilterCheck) return BadRequestException(res, "Image didn't pass moderation filter")

    next()
}

export default ImageDetection