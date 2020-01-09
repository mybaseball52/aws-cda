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

module.exports = {
  persistKeyPair,
  createIamRole,
  createSecurityGroup,
  getPublicFiles,
  getContentType
}
