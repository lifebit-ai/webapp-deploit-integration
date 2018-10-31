// https://blog.stvmlbrn.com/2017/04/07/submitting-form-data-with-react.html

// https://www.digitalocean.com/community/tutorials/how-to-upload-a-file-to-object-storage-with-node-js
// https://medium.com/ecmastack/uploading-files-with-react-js-and-node-js-e7e6b707f4ef
// https://github.com/abachuk/uploading-files-react-node
const aws          = require('aws-sdk')
const express      = require('express')
const multer       = require('multer')
const multerS3     = require('multer-s3')
const config       = require('config')
const cookieParser = require('cookie-parser')
const LifeBit      = require('./lifebit')

const app = express()

app.use(cookieParser())
app.use(express.static('dist'))

const lifebit = new LifeBit(config.get('lifebit.apikey'))

const s3 = new aws.S3({
  accessKeyId: config.get('aws.key'),
  secretAccessKey: config.get('aws.secret'),
  region: config.get('aws.region'),
})

// Change bucket property to your Space name
const upload = multer({
  storage: multerS3({
    s3,
    bucket: config.get('aws.bucket'),
    // acl: 'public-read',
    key: (request, file, cb) => {
      console.log(file)
      cb(null, file.originalname)
    }
  })
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('File uploaded successfully.')
  console.log(req.file)
  const { file } = req
  const job = await lifebit.startAncestryJob(file)

  // res.cookie('jobId', '5bc87c9c55424c2b6c303b3c', { maxAge: 900000 })
  res.cookie('jobId', job._id, { maxAge: 3600000 })
  // res.clearCookie('name')
  // res.status(200).json({ success: true, job })
  res.status(200).json({ success: true, file, jobId: job._id })
})

app.get('/api/job', async (req, res) => {
  try {
    console.log(req.cookies)
    const { jobId } = req.cookies
    const job = jobId ? await lifebit.getJob(jobId) : null
    console.log(job)
    res.json({ job })
  } catch (e) {
    console.log(e)
  }
})

app.get('/api/job/results', async (req, res) => {
  try {
    console.log(req.cookies)
    const { jobId } = req.cookies
    const job = jobId ? await lifebit.getJob(jobId) : null
    const { results } = job
    console.log('results', results)
    if (results && results.s3Bucket && results.s3Prefix) {
      const s3params =  {
        Bucket: results.s3Bucket,
        Prefix: results.s3Prefix
      }
      console.log('s3params', s3params)
      const s3Data = await new Promise((resolve, reject) => s3.listObjectsV2(s3params, (err, data)  => (err ? reject(err) : resolve(data))))
      console.log('s3Data', s3Data)
      const pngFile = s3Data ? s3Data.Contents.find(c => c.Key.match(/.*ancestry_map\.png$/)) : null
      const txtFile = s3Data ? s3Data.Contents.find(c => c.Key.match(/.*ancestry_composition\.txt$/)) : null
      console.log('pngFile', pngFile, txtFile)
      if (pngFile && txtFile) {
        const signUrlParams = {
          Bucket: results.s3Bucket,
          Key: pngFile.Key,
          Expires: 3600
        }
        const url = s3.getSignedUrl('getObject', signUrlParams)
        const txtContentParams = {
          Bucket: results.s3Bucket,
          Key: txtFile.Key
        }
        const content = await new Promise((resolve, reject) => s3.getObject(txtContentParams, (err, data)  => err ? reject(err) : resolve(data.Body.toString())))
        console.log('url', url, content)
        res.json({ success: true, url, content })
        return
      }
    }
    res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
})

app.listen(config.get('app.port'), () => console.log(`Listening on port ${config.get('app.port')}!`))
