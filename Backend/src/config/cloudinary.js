const { v2: cloudinary } = require('cloudinary')

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '348514735729946'
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'at660K5qlTnp6ceeaX1zNUIL2uo'

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

module.exports = cloudinary
