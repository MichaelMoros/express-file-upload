import { NextFunction, Response } from "express";
import { BadRequestException, validateTag } from "../lib/utils";

const BodyCheckUpload = (req: any, res: Response, next: NextFunction) => {
    let userTags; 
    const description = req.body.description

    try {
        userTags = JSON.parse(req.body.tags)
    } catch (err) {
        userTags = req.body.tags
    }

    if (typeof description !== 'string') {
        return BadRequestException(res, `Description must be a valid string 2 to 32 characters.`)
    }

    if (typeof description === 'string') {
        if (description.length <= 1 || description.length >= 32) {
            return BadRequestException(res, `Description must be a valid string 2 to 32 characters.`)
        }
    }

    if (typeof userTags !== 'string' && !Array.isArray(userTags)) {
        return BadRequestException(res, `Tag/Tags must be string or string[]`)
    }

    if (typeof userTags === 'string') {
        if (!validateTag(userTags) || userTags.length === 0 || userTags.length >= 17) {
            return BadRequestException(res, `Tag must be all letters a-Z and minimum of 1-16 characters.`)
        }
    }

    if (Array.isArray(userTags)) {
        if (!userTags.every((tag) => validateTag(tag)) || (userTags.some((tag) => tag.length === 0 || tag.length >= 17))) {
            return BadRequestException(res, `Tags must be all letters a-Z and minimum of 1-16 characters.`)
        }
    }

    const uniqueUserTags = Array.from(new Set(new Array(userTags).flat(2))).map(x => x.toLowerCase())

    if (uniqueUserTags.length > 5) {
        return BadRequestException(res, 'Maximum tags count five(5)')
    }

    req.transport = uniqueUserTags
    next()
}

export default BodyCheckUpload