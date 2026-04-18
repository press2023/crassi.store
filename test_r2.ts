import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: "https://538117e7cd43611bbbb8c4a017e94736.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "fd2d0f6354c376063fba364bf1a60bf2",
    secretAccessKey: "e9891147ed4dae8e9c6d2f2730d0892cd5329b32c625b0c73c2b6e555e7dcc44"
  },
})

async function run() {
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: "victorian",
      Key: 'test-upload.txt',
      Body: "hello",
      ContentType: 'text/plain'
    }))
    console.log('Upload success!')
  } catch (err) {
    console.error('R2 Upload error:', err)
  }
}
run()
