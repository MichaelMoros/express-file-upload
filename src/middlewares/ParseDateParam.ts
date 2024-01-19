import { formatISO, parseISO, sub } from "date-fns"
import { BadRequestException } from "../lib/utils"
import { NextFunction, Response } from "express"

const getTwentyHoursAgo = () => {
    const currentDate = new Date()
    return sub(currentDate, { hours: 24 })
}

const ParseDateParam = (req: any, res: Response, next: NextFunction) => {
    const queryParams = req.query;
    let startDateParam = queryParams.startDate ?? null

    const startDate = startDateParam ? new Date(startDateParam.toString()) : getTwentyHoursAgo();

    try {
        const isoDate = formatISO(startDate)
        const dateObject = parseISO(isoDate)
        req.transport = dateObject
        next()
    } catch (err) {
        return BadRequestException(res, `Invalid date format in parameters.`)
    }
}

export default ParseDateParam