// Set all required env vars before any module loads.
// Handlers and libs throw at init time if these are missing.
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'
process.env.ALLOWED_ORIGIN = 'http://localhost:3000'
process.env.DYNAMODB_TABLE_NAME = 'test-table'
process.env.S3_BUCKET_NAME = 'test-bucket'
process.env.CLOUDFRONT_DOMAIN = 'https://test.cloudfront.net'
process.env.ADMIN_API_KEY = 'test-admin-key'
process.env.AWS_REGION = 'ap-southeast-1'
