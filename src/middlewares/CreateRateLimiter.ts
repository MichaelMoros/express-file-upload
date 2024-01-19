import rateLimit from 'express-rate-limit'

const CreateRateLimiter = (requestCount: number) => {
    return rateLimit({
        windowMs: 60 * 1000,
        max: requestCount || 100,
        message: "Too many request from this IP, please try again later"
    })
}

export default CreateRateLimiter