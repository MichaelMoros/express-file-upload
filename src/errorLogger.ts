import winston from 'winston'

const ErrorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), 
        new winston.transports.File({ filename: 'error.log' })
    ]
});

export default ErrorLogger