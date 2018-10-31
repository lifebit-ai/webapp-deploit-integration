
module.exports = {
  app: {
    port: process.env.PORT || 8080
  },
  aws: {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: process.env.S3_BUCKET || 'tmp-test3',
    region: process.env.AWS_REGION || 'eu-west-1',
  },
  lifebit: {
    workflow: '070e7c17ea5623565f8e4a3f', // '5bc73a4055424c2b6c303a90',
    project: '5bc73a0955424c2b6c303a8e',
    apikey: 'TODO',
    instanceType: 'c3.xlarge',
    command: process.env.LIFEBIT_COMMAND || 'python /controller.py'
  }
}
