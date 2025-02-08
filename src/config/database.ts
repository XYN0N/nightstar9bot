// Use environment variables for sensitive data
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/starnight';