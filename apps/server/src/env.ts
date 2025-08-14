import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })