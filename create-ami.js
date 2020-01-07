// Imports
// TODO: Import the aws-sdk
const AWS = require('aws-sdk');

// TODO: Configure region
AWS.config.update({ region: 'us-east-1', })

// Declare local variables
// TODO: Create an ec2 object
const ec2 = new AWS.EC2();

createImage('<imageid>', 'hamsterImage')
.then(() => console.log('Complete'))

function createImage (seedInstanceId, imageName) {
  //Implement AMI creation
  const params = {
    InstanceId: seedInstanceId,
    Name: imageName
  }

  return new Promise((resolve, reject) => {
    ec2.createImage(params, (err, data)=>{
      if(err) reject(err);
      else resolve(data);
    })
  })
}
