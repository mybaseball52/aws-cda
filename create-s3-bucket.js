// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
// Create new s3 object
const s3 = new AWS.S3();

createBucket('hamster-bucket-kevin')
.then((data) => console.log(data))

function createBucket (bucketName) {
  // Define params object
  const params = {
    Bucket: bucketName,
    ACL: 'public-read'
  }
  return new Promise((resolve, reject) => {
    // Create s3 bucket
    s3.createBucket(params, (err, data) => {
      if (err) reject(err)
      else resolve(data);
    })
  })
}
