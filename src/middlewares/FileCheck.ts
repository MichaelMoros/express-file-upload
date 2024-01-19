import multer, { MulterError } from 'multer'
import { NextFunction, Request, Response } from 'express';
import { BadRequestException } from '../lib/utils';

interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

const checkFilename = (filename: string) => /^[a-zA-Z0-9_.-]+( [a-zA-Z0-9_.-]+)*$/.test(filename)
const validateFileType = (req: any, file: UploadedFile, cb: any) => {
    const isValidFilename = checkFilename(file.originalname)

    if (!isValidFilename) {
        const error = new Error('Invalid file name')
        cb(error, false)
    }

    if (!file.mimetype.startsWith('image/')) {
        const error = new Error('Invalid file type')
        cb(error, false)
    }

    if (file.size > 5 * 1024 * 1024 ) {
        const multerError = new MulterError('LIMIT_FILE_SIZE', 'Invalid file size');
        return cb(multerError, false);
    }

    cb(null, true)
};

const storage = multer.memoryStorage()
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024     
    },
    fileFilter: validateFileType
})


const FileCheck = (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, async (err) => {
        if (!req.file) {
            return BadRequestException(res, "Missing file")
        }

        if (err) {
            return BadRequestException(res, err.message)
        }

        next()
    })
}


export default FileCheck