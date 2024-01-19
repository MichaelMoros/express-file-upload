import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../lib/utils";

const ParamCheck = (key: string, testFunction: (val: string) => boolean) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const target = req.params[key]

        if (!target) return BadRequestException(res)

        if (!testFunction(target)) {
            return BadRequestException(res)
        }

        next()
    }
}


export default ParamCheck