import { Response } from 'express'
import { ObjectId } from 'mongodb'

const generateS3ObjectURL = (objectId: string) => {
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectId}`
}

const BadRequestException = (res: Response, message = 'Bad Request') => {
    return res.status(400).json({ error: { code: 400, message }})
}

const NotFoundException = (res: Response, message = 'Not Found') => {
    return res.status(404).json({ error: { code: 404, message }})
}

const isValidMongoDbObjectId = (id: string) => {
    try {
        return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
    } catch (error) {
        return false
    }
}

const validateTag = (str: string) => {
    if (typeof str !== 'string') return false
    return /^[a-zA-Z]+$/.test(str)
}

export { 
    generateS3ObjectURL, 
    BadRequestException, 
    NotFoundException, 
    isValidMongoDbObjectId,
    validateTag
}