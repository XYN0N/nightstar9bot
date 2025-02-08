// Import environment variables directly
const REDIS_URL = import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379';
const MONGODB_URL = import.meta.env.VITE_MONGODB_URL || 'mongodb://localhost:27017/starnight';

export { REDIS_URL, MONGODB_URL };