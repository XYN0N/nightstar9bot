// Use process.env for server-side code
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/starnight';

export { REDIS_URL, MONGODB_URL };