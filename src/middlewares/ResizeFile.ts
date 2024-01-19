import { NextFunction, Response } from "express";
import sharp from "sharp";

const ResizeFile = async (req: any, res: Response, next: NextFunction) => {
    const file = req.file as Express.Multer.File
    const { description } = req.body

    try {
        const { buffer } = await sharp(file.buffer)
        .jpeg({ quality: 80 })
        .toBuffer();

        req.processData = { 
            buffer: buffer,
            mime: file.mimetype,
            tags: req.transport, 
            description,
            fileKey: `${Date.now()}_${file.originalname}`
        };

        next ()
    } catch (sharpError) {
        return next(sharpError)
    }
}

export default ResizeFile
