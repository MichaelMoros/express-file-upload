import { BadRequestException } from '../lib/utils'
import { NextFunction, Response } from 'express'
import { Order } from '../enums/enums'

const ParseQueryParams = (req: any, res: Response, next: NextFunction) => {
    const queryParams = req.query;
  
    const skip = queryParams.skip !== undefined ? parseInt(queryParams.skip as string, 10) : 0;
    
    if (isNaN(skip)) {
      return BadRequestException(res, 'Invalid value for skip parameter')
    }

    if (skip < 0) {
        return BadRequestException(res, 'Skip must be positive number')
    }
  
    const orderQuery = queryParams.orderQuery !== undefined ? queryParams.orderQuery as Order : Order.NEWEST_FIRST;

    if (!['newest-first', 'oldest-first', '1', '-1'].includes(orderQuery)) {
        return BadRequestException(res, 'Invalid value for order parameter');
    }
    
    const orderValue = ['1', '-1'].includes(orderQuery) ? (parseInt(orderQuery, 10) === 1 ? Order.NEWEST_FIRST : Order.OLDEST_FIRST) : orderQuery;
    

    const unexpectedParams = Object.keys(queryParams).filter(param => param !== 'skip' && param !== 'order');
    if (unexpectedParams.length > 0) {
        return BadRequestException(res, `Unexpected query parameters: ${unexpectedParams.join(', ')}`)
    }
  
    req.transport = { skip, order: orderValue };

    next();
};


export default ParseQueryParams