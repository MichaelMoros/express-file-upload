import express, { NextFunction, Request, Response } from 'express'
const app = express()
import EnvConfig from './envConfig'
import ErrorLogger from './errorLogger'
import specs from './swagger'
import swaggerUi from 'swagger-ui-express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { NotFoundException } from './lib/utils'
import PhotosRouter from './routes/photos'
import TagsRouter from './routes/tags/'

const currentDirectory = path.dirname(__dirname);
app.use(express.static(path.join(currentDirectory, '')));

const mongoClient = new MongoClient(EnvConfig.getMongodbConnectionString())

const s3Client = new S3Client({
    region: EnvConfig.getAwsRegion(),
    credentials: {
        accessKeyId: EnvConfig.getAwsAccessKey(),
        secretAccessKey: EnvConfig.getAwsSecretAccessKey()
    },
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(cookieParser())
app.set('trust proxy', 1)
app.use(cors({
    origin: [EnvConfig.getClientAddress(), "http://localhost:3000"],
    optionsSuccessStatus: 200,
    credentials: true
}))

app.use('/api/photos', PhotosRouter)
app.use('/api/tags', TagsRouter)
app.use(session({
    secret: EnvConfig.getSessionSecretKey(),
    resave: false,
    saveUninitialized: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

s3Client
    .send(new ListBucketsCommand({}))
    .then(() => {
        console.log('connected to S3')
        mongoClient.connect()
            .then(() => console.log('connected to MongoDb'))
            .then(() => app.listen(5000, () => {
                console.log(`server up on ${EnvConfig.getPort()}`)
            }))
            .catch(mongoError => {
                console.log('mongo db error', mongoError.message)
                process.exit(1)
            })
    }).catch(s3Error => {
        console.log('S3 error', s3Error.message)
        process.exit(1)
    })

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    ErrorLogger.error(err.stack || err.message || err);
    return res.status(500).send('Internal Server Error');
});


app.use((req, res) => NotFoundException(res, `Endpoint doesn't exist. Visit /api-docs for API documentation.`));

export { s3Client, mongoClient, app }