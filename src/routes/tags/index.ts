import express, { NextFunction } from 'express'
import ParamCheck from '../../middlewares/ParamCheck'
import { NotFoundException, validateTag } from '../../lib/utils'
import ParseQueryParams from '../../middlewares/ParseQueryParams'
import { mongoClient } from '../../app'
import ParseDateParam from '../../middlewares/ParseDateParam'
const router = express.Router()

router
    .route('/:tag')
    .get(ParamCheck('tag', validateTag), ParseQueryParams, async (req: any, res: any, next: NextFunction) => {
    const tag = req.params.tag
    
    try {
        const db = mongoClient.db('photodb')
        const photos = db.collection('photos')
        const tags = db.collection('tags')

        const tagDocument = await tags.findOne({ name: tag.toLowerCase() })
        if (!tagDocument) return NotFoundException(res, `Tag: ${tag} doesn't exist.`)

        const { skip, order } = req.transport

        const foundDocuments = await photos.aggregate([
            {
                $match: {
                    tags: {
                        $in: [tagDocument._id]
                    }
                }
            },
            {
                $sort: {
                    createdAt: (order === 'newest-first') ? -1 : 1
                }
            },
            {
                $skip: skip
            },
            {
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'resolvedTags'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    src: 1,
                    description: 1,
                    createdAt: 1,
                    tags: {
                        $map: {
                            input: '$resolvedTags',
                            as: 'tag',
                            in: '$$tag.name'
                        }
                    }
                }
            },
            {
               $limit: 2
            }
        ]).toArray()

        return res.status(200).json({ data: foundDocuments })
    } catch (mongoDbError) {
        next(mongoDbError)
    }
})

router
    .route('/')
    .get(ParseDateParam, async (req: any, res: any, next) => {
    const startDate = req.transport
    const endDate = new Date()

    try {
        const db = mongoClient.db('photodb')
        const collection = db.collection('tags')

        const documents = await collection.find({
            createdAt: { $gte: startDate, $lte: endDate },
        })
        .sort({ createdAt: 1 })
        .limit(10)
        .toArray();

        return res.status(200).json({ data: documents })
    } catch (mongoDbError) {
        next(mongoDbError)
    }
})

export default router