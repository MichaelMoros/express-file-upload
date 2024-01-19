import { NextFunction, Request, Response } from "express"
import { BadRequestException, isValidMongoDbObjectId } from "../lib/utils"

const BodyCheckSeenIds = (req: Request, res: Response, next: NextFunction) => {
    const { seenIds, ...otherProps } = req.body 

    if (Object.keys(otherProps).length > 0) {
        return BadRequestException(res)
    }

    if (!seenIds || !seenIds.every((id: string) => isValidMongoDbObjectId(id))) {
        return BadRequestException(res, 'All Id/s must be a valid MongoDb ObjectId')
    }

    next()

}

export default BodyCheckSeenIds