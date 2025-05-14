import dotenv from 'dotenv';

dotenv.config();

export const config = {
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
}; 