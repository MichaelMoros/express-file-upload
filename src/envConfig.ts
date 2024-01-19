import dotenv from 'dotenv'
dotenv.config()

class EnvConfiguration {
    private awsAccessKey: string
    private awsSecretAccessKey: string
    private awsBucket: string
    private awsRegion: string
    private awsReadOnlyAccessKey: string
    private awsReadOnlySecretAccessKey: string
    private mongoDbUser: string
    private mongoDbPassword: string
    private port: string
    private sessionSecretKey: string
    private clientAddress: string
    private mongodbConnectionString: string

    constructor() {
        this.awsAccessKey = String(process.env.ACCESS_KEY ?? "")
        this.awsSecretAccessKey = String(process.env.SECRET_ACCESS_KEY ?? "")
        this.awsBucket = String(process.env.AWS_BUCKET ?? "")
        this.awsRegion = String(process.env.AWS_REGION ?? "")
        this.mongoDbUser = String(process.env.MONGO_USER ?? "")
        this.mongoDbPassword = String(process.env.MONGO_PASS ?? "")
        this.port = String(process.env.PORT ?? "")
        this.sessionSecretKey = String(process.env.SESSION_SECRET_KEY ?? "")
        this.clientAddress = String(process.env.CLIENT_ADDRESS ?? "")
        this.mongodbConnectionString = String(process.env.MONGO_DB_URI ?? "")
    }

    public getAwsAccessKey() {
        return this.awsAccessKey
    }

    public getAwsSecretAccessKey() {
        return this.awsSecretAccessKey
    }

    public getAwsBucket() {
        return this.awsBucket
    }

    public getAwsRegion() {
        return this.awsRegion
    }

    public getAwsReadOnlyAccessKey() {
        return this.awsReadOnlyAccessKey
    }

    public getAwsReadOnlySecretAccessKey() {
        return this.awsReadOnlySecretAccessKey
    }

    public getMongoDbPassword() {
        return this.mongoDbPassword
    }

    public getMongoDbUser() {
        return this.mongoDbUser
    }

    public getPort() {
        return this.port
    }

    public getSessionSecretKey() {
        return this.sessionSecretKey
    }

    public getClientAddress() {
        return this.clientAddress
    }

    public getMongodbConnectionString() {
        return this.mongodbConnectionString
    }
}

const EnvConfig = new EnvConfiguration()

export default EnvConfig