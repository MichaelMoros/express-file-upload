import express, { Request, Response, NextFunction } from 'express'
const router = express.Router()
import { mongoClient, s3Client } from '../../app'
import BodyCheckSeenIds from '../../middlewares/BodyCheckSeenIds'
import { ObjectId } from 'mongodb'
import ParamCheck from '../../middlewares/ParamCheck'
import { NotFoundException, generateS3ObjectURL, isValidMongoDbObjectId } from '../../lib/utils'
import CreateRateLimiter from '../../middlewares/CreateRateLimiter'
import FileCheck from '../../middlewares/FileCheck'
import BodyCheckUpload from '../../middlewares/BodyCheckUpload'
import ResizeFile from '../../middlewares/ResizeFile'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import ImageDetection from '../../middlewares/ImageDetection'
router.use(express.json())

router.route('/random')
    .get(async (req: Request, res: Response, next: NextFunction) => {

        try {
            const db = mongoClient.db('photodb')
            const photos = db.collection('photos')

            const randomDocuments = await photos.aggregate([
                {
                    $sample: {
                        size: 3
                    }
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
            ]).toArray()

            return res.status(200).json({ data: randomDocuments })
        } catch (err) {
            next(err)
        }
    })

router
    .route('/random')
    .post(BodyCheckSeenIds, async (req, res, next) => {
        const ids = req.body.seenIds
        const seenIdsNotIn = ids.map((item) => new ObjectId(item))

        try {
            const db = mongoClient.db('photodb')
            const photos = db.collection('photos')
            const foundDocuments = await photos.aggregate([
                {
                    $match: (seenIdsNotIn.length > 0) ?
                        {
                            _id: {
                                $nin: seenIdsNotIn
                            }
                        }
                        :
                        {}
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
                    $sample: {
                        size: 3
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
            ]).toArray()

            return res.status(200).json({ data: foundDocuments })
        } catch (err) {
            console.log(err)
            next(err)
        }
    })

router
    .route('/:photoId')
    .get(ParamCheck('photoId', isValidMongoDbObjectId), async (req, res, next) => {
        const photoId = req.params.photoId

        try {
            const db = mongoClient.db('photodb')
            const photos = db.collection('photos')

            const photoDocument = await photos.aggregate([
                {
                    $match: {
                        _id: new ObjectId(photoId)
                    }
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
                        createdAt: 1,
                        description: 1,
                        tags: {
                            $map: {
                                input: '$resolvedTags',
                                as: 'tag',
                                in: '$$tag.name'
                            }
                        }
                    }
                }
            ]).toArray()

            if (!photoDocument) return NotFoundException(res, `Photo with id ${photoId} not found.`)

            return res.status(200).json({ data: photoDocument[0] })
        } catch (err) {
            next(err)
        }
    })

router
    .route('/upload')
    .post(CreateRateLimiter(100), FileCheck, BodyCheckUpload, ResizeFile, ImageDetection, async (req: any, res: any, next: any) => {

        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: req.processData.fileKey,
            Body: req.processData.buffer,
            ContentType: req.processData.mime
        });

        const payload = req.processData.tags

        try {
            await s3Client.send(uploadCommand)
            const session = await mongoClient.startSession()

            try {
                await session.withTransaction(async () => {
                    const db = mongoClient.db('photodb')
                    const tagsCollection = db.collection('tags')
                    const photoCollection = db.collection('photos')
                    const bulkOps: any[] = []

                    for (let tag of payload) {
                        const foundTag = await tagsCollection.findOne({ name: tag }, { session })
                        if (!foundTag) {
                            bulkOps.push({
                                insertOne: {
                                    document: {
                                        name: tag.toLowerCase(),
                                        createdAt: new Date(),
                                        tagCount: 1
                                    }
                                }
                            })
                        } else {
                            bulkOps.push({
                                updateOne: {
                                    filter: {
                                        _id: new ObjectId(foundTag._id)
                                    },
                                    update: {
                                        $inc: { tagCount: 1 }
                                    }
                                }
                            })
                        }
                    }

                    const insertWriteResults = await (await tagsCollection.bulkWrite(bulkOps)).insertedIds

                    // attempt to extract the insertIds, since we're not sure what operations are executed from bulkOps
                    const idsFromBulkWrite = Object.values(insertWriteResults)

                    // also need to extractIds from bulkOps, since bulkWrite doesn't return the insertIds for update operations
                    const filteredUpdateCommands = Object.values(bulkOps).filter((k) => k['updateOne'])
                    const updateIdsForBulkOps = filteredUpdateCommands.map((k) => Object.values(k['updateOne'].filter))

                    const embedIds = [idsFromBulkWrite, updateIdsForBulkOps].flat(2)
                    const objectURL = generateS3ObjectURL(req.processData.fileKey)

                    const result = await photoCollection.insertOne({
                        name: req.processData.fileKey,
                        src: objectURL,
                        tags: embedIds,
                        description: req.processData.description,
                        createdAt: new Date()
                    }, { session })

                    return res.status(200).json({ result })
                })


            } catch (mongoDbTransactionError) {
                next(mongoDbTransactionError)
            } finally {
                await session.endSession()
            }
        } catch (s3UploadError) {
            next(s3UploadError)
        }
    })


export default router