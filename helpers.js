const fs = require('fs')
const path = require('path')
const os = require('os')
const glob = require('glob')
const AWS = require('aws-sdk')

function persistKeyPair (keyData) {
  return new Promise((resolve, reject) => {
    const keyPath = path.join(os.homedir(), '.ssh', keyData.KeyName)
    const options = {
      encoding: 'utf8',
      mode: 0o600
    }

    fs.writeFile(keyPath, keyData.KeyMaterial, options, (err) => {
      if (err) reject(err)
      else {
        console.log('Key written to', keyPath)
        resolve(keyData.KeyName)
      }
    })
  })
}

function createSecurityGroup (sgName, port) {
  return new Promise((resolve, reject) => {
    const ec2 = new AWS.EC2()
    const params = {
      Description: sgName,
      GroupName: sgName
    }

    ec2.createSecurityGroup(params, (err, data) => {
      if (err) reject(err)
      else {
        const params = {
          GroupId: data.GroupId,
          IpPermissions: [
            {
              IpProtocol: 'tcp',
              FromPort: port,
              ToPort: port,
              IpRanges: [
                {
                  CidrIp: '0.0.0.0/0'
                }
              ]
            }
          ]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if (err) reject(err)
          else resolve(data.GroupId)
        })
      }
    })
  })
}

function createIamRole (roleName) {
  const profileName = `${roleName}_profile`
  const iam = new AWS.IAM()
  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ] }'
  }

  return new Promise((resolve, reject) => {
    iam.createRole(params, (err) => {
      if (err) reject(err)
      else {
        const params = {
          PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          RoleName: roleName
        }

        iam.attachRolePolicy(params, (err) => {
          if (err) reject(err)
          else {
            iam.createInstanceProfile({ InstanceProfileName: profileName }, (err, iData) => {
              if (err) reject(err)
              else {
                const params = {
                  InstanceProfileName: profileName,
                  RoleName: roleName
                }
                iam.addRoleToInstanceProfile(params, (err) => {
                  if (err) reject(err)
                  else {
                    // Profile creation is slow, need to wait
                    setTimeout(() => resolve(iData.InstanceProfile.Arn), 10000)
                  }
                })
              }
            })
          }
        })
      }
    })
  })
}

function getPublicFiles () {
  return new Promise((resolve, reject) => {
    glob('../../public/**/*.*', (err, files) => {
      if (err) reject(err)
      else {
        const filePromises = files.map((file) => {
          return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
              if (err) reject(err)
              else resolve(data)
            })
          })
        })

        Promise.all(filePromises)
        .then((fileContents) => {
          return fileContents.map((contents, i) => {
            return {
              contents,
              name: files[i].replace('../../public/', '')
            }
          })
        })
        .then(resolve)
        .catch(reject)
      }
    })
  })
}

function getContentType (filename) {
  if (filename.match(/\.html/)) {
    return 'text/html'
  }
  if (filename.match(/\.png/)) {
    return 'image/png'
  }
  if (filename.match(/\.jpg/)) {
    return 'image/jpeg'
  }
  if (filename.match(/\.js/)) {
    return 'text/javascript'
  }
  if (filename.match(/\.css/)) {
    return 'text/css'
  }
}

const assets = require('./util/assets')

const hamsterData = [
  {
    id: 1,
    name: 'Zepto',
    type: 'Speedball',
    src: assets.hamster1,
    results: []
  }, {
    id: 2,
    name: 'Milkshake',
    type: 'Speedball',
    src: assets.hamster2,
    results: []
  }, {
    id: 3,
    name: 'Fievel',
    type: 'Tiny Terror',
    src: assets.hamster3,
    results: []
  }, {
    id: 4,
    name: 'Baby Ham',
    type: 'Roller',
    src: assets.hamster4,
    results: []
  }, {
    id: 5,
    name: 'Tater',
    type: 'Stealth',
    src: assets.hamster5,
    results: []
  }, {
    id: 6,
    name: 'Peter Pan',
    type: 'ZigZagger',
    src: assets.hamster6,
    results: []
  }
]
const raceData = [
  {
    id: 1,
    venue: 'Petco 2000',
    city: 'Seattle, WA',
    date: '04/29/17',
    results: []
  }, {
    id: 2,
    venue: 'Triscuit Circuit 4700',
    city: 'Daytona Beach, FL',
    date: '09/21/17',
    results: []
  }, {
    id: 3,
    venue: 'Kraft 35',
    city: 'Tokyo, Japan',
    date: '07/14/17',
    results: []
  }
]

function getHamsterData () {
  return Promise.resolve(hamsterData)
}

function getRaceData () {
  return Promise.resolve(raceData)
}

module.exports = {
  persistKeyPair,
  createIamRole,
  createSecurityGroup,
  getPublicFiles,
  getContentType,
  getHamsterData,
  getRaceData,
}
