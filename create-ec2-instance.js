// Imports
const AWS = require('aws-sdk');
const helpers = require('./helpers')

//Configure region
AWS.config.update({ region: 'us-east-1', })
// Declare local variables
// TODO: Create an ec2 object
const ec2 = new AWS.EC2();
const sgName = 'hamster_sg'
const keyName = 'hamster_key'

// Do all the things together
createSecurityGroup(sgName)
.then(() => {
  return createKeyPair(keyName)
})
.then(helpers.persistKeyPair)
.then(() => {
  return createInstance(sgName, keyName)
})
.then((data) => {
  console.log('Created instance with:', data)
})
.catch((err) => {
  console.error('Failed to create instance with:', err)
})

// Create functions

function createSecurityGroup (sgName) {
  //Implement sg creation & setting SSH rule
  const params = {
    Description: sgName,
    GroupName: sgName
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data)=>{
      if(err) reject(err)
      else {
        const params = {
          GroupId: data.GroupId,
          IpPermissions: [
            {
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              IpRanges: [
                {
                  CidrIp: '0.0.0.0/0'
                }
              ]
            },{
              IpProtocol: 'tcp',
              FromPort: 3000,
              ToPort: 3000,
              IpRanges: [
                {
                  CidrIp: '0.0.0.0/0'
                }
              ]
            },
          ]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if(err) reject(err);
          else resolve();
        })
      }
    })
  })
}

function createKeyPair (keyName) {
  //Create keypair
  const params = {
    KeyName: keyName
  }

  return new Promise((resolve, reject) => {
    ec2.createKeyPair(params, (err, data)=>{
      if(err) reject(err)
      else resolve(data);
    })
  })
}

function createInstance (sgName, keyName) {
  //create ec2 instance
  const params = {
    ImageId: 'ami-0dc23fa775779bb1c',
    InstanceType: 't2.micro',
    KeyName: keyName,
    MaxCount: 1,
    MinCount: 1,
    SecurityGroups:[
      sgName
    ],
    UserData:'IyEvYmluL2Jhc2gKY3VybCAtLXNpbGVudCAtLWxvY2F0aW9uIGh0dHBzOi8vcnBtLm5vZGVzb3VyY2UuY29tL3NldHVwXzgueCB8IHN1ZG8gYmFzaCAtCnN1ZG8geXVtIGluc3RhbGwgLXkgbm9kZWpzCnN1ZG8geXVtIGluc3RhbGwgLXkgZ2l0CmdpdCBjbG9uZSBodHRwczovL2dpdGh1Yi5jb20vcnlhbm11cmFrYW1pL2hiZmwuZ2l0CmNkIGhiZmwKbnBtIGkKbnBtIHJ1biBzdGFydAoK' //shell script
  }

  return new Promise((resolve, reject) => {
    ec2.runInstances(params, (err, data)=>{
      if(err) reject(err)
      else resolve(data);
    })
  })
}

