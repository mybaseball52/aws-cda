// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
// Create kinesis object
const kinesis = new AWS.Kinesis();
const streamName = 'hamster-race-results'

createKinesisStream(streamName)
.then(data => console.log(data))

function createKinesisStream (streamName) {
  // Create params const
  const params = {
    ShardCOunt: 1,
    StreamName: streamName,

  }

  return new Promise((resolve, reject) => {
    // Create kinesis stream
    kinesis.createStream(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    }) 
  })
}
