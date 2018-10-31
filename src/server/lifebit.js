
const axios = require('axios')
const config = require('config')

function LifeBitUtility(apikey) {
  const headers = {
    'Content-Type': 'application/json',
    apikey
  }

  const host = 'api.lifebit.ai'

  this.startJob = ({ workflow, project, instanceType, parameters, executionPlatform = 'aws' }) => {
    const data = {
      workflow,
      project,
      instanceType,
      executionPlatform,
      parameters
    }
    return axios({
      method: 'post',
      url: `https://${host}/api/v1/jobs`,
      headers,
      data
    }).then(response => response.data)
  }

  this.getJob = jobId => axios.get(`https://${host}/api/v1/jobs/${jobId}`, { headers }).then(response => response.data)

  this.startAncestryJob = file => {
    const parameters = [
      {
        prefix: '--',
        name: 'runs',
        parameterKind: 'textValue',
        textValue: 5
      },
      {
        prefix: '--',
        name: 'rawdata',
        dataItemEmbedded: {
          type: 'S3File',
          data: {
            name: file.originalname,
            s3BucketName: file.bucket,
            s3ObjectKey: file.key,
            sizeInBytes: file.size
          }
        }
      }
    ]
    const data = {
      workflow: config.get('lifebit.workflow'),
      project: config.get('lifebit.project'),
      instanceType: config.get('lifebit.instanceType'),
      parameters
    }
    return this.startJob(data)
  }
}

module.exports = LifeBitUtility
