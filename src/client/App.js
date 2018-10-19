import React, { Component } from 'react'
import { withCookies, Cookies } from 'react-cookie'
import 'bootstrap/dist/css/bootstrap.min.css'
import './app.css'
const axios = require('axios')

const COOKIE_NAME = 'jobId'

class App extends Component {

  constructor(props) {
    super(props)
    const { cookies } = props
    this.state = {
      file: null,
      submitting: false,
      jobId: cookies.get(COOKIE_NAME)
    }
    this.submitFile = this.submitFile.bind(this)
    this.render = this.render.bind(this)
  }

  submitFile = event => {
    const self = this
    self.setState({ submitting: true })
    event.preventDefault()
    console.log('eve', event.target.elements)
    const formData = new FormData()
    formData.append('file', self.state.file)
    axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      console.log('uploaded', response)
      const { jobId } = response.data
      self.setState({ submitting: false, jobId })
    }).catch(error => {
      console.error(error)
      self.setState({ submitting: false })
    })
  }

  render() {
    const { file, submitting, jobId, status } = this.state

    let content = <FileUploader parent={this} file={file} />
    if (jobId) {
      if (status === 'completed') {
        content = <Results parent={this} />
      } else if (status === 'failed') {
        content = <div>Sorry the computation of your ancestry failed</div>
      } else {
        content = <JobStatus parent={this} />
      }
    }
    return (
      <div className="container">
        {submitting ? <Overlay> <Loader /> </Overlay> : null}
        <div className="row">
          <div className="col-12 text-center">
            <h1 className="mt-5">Genetic ancestry app (beta)</h1>
            {content}
          </div>
        </div>
      </div>
    )
  }
}
export default withCookies(App)


const Overlay = ({ children }) => <div className="overlay">{children}</div>

const Loader = () => <div className="loader" />

const FileUploader = ({ parent, file }) => (
  <form onSubmit={parent.submitFile} className="form-upload">
    <div className="form-label-group">
      <input className="form-control" onChange={e => parent.setState({ file: (e.target.files && e.target.files[0] ? e.target.files[0] : null) })} type="file" name="file" />
    </div>
    <button className="btn btn-lg btn-primary btn-block" disabled={file ? false : 'disabled'} type="submit" value="Submit">Send</button>
  </form>
)

class JobStatus extends Component { // eslint-disable-line
  constructor(props) {
    super(props)
    this.check = this.check.bind(this)
    this.state = {}
  }

  componentDidMount() {
    this.timerID = setInterval(this.check, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timerID)
  }

  check() {
    axios.get('/api/job').then(res => {
      const { status } = res.data.job
      if (status === 'completed' ||  status === 'failed') {
        clearInterval(this.timerID)
        this.props.parent.setState({ status })
      } else {
        this.setState({ status })
      }
    })
  }

  render() {
    return (
      <div>
        Computing your ancestry. Please wait ...
      </div>
    )
  }
}

class Results extends Component { // eslint-disable-line
  constructor(props) {
    super(props)
    this.getResults = this.getResults.bind(this)
    this.state = { fetching: true }
    this.getResults()
  }

  getResults() {
    axios.get('/api/job/results').then(res => {
      const {
        success,
        url,
        content
      } = res.data
      if (success) {
        this.setState({ url, content })
      } else {
        this.setState({ error: true })
      }
    })
      .catch(() => this.setState({ error: true }))
      .finally(() => this.setState({ fetching: false }))
  }

  render() {
    const {
      url,
      content,
      fetching,
      error,
    } = this.state

    if (error) {
      return (
        <div>
          Sorry something went wrong we cannot fetch your results
        </div>
      )
    }

    if (url && content) {
      const ancestryGroups = content.split('Ancestry group:').map(s => s.replace(/(\r|\n|\r\n)/gi, '').split(', composition: ')).filter(i => i.length >= 2)
      ancestryGroups.sort(([, percentageA], [, percentageB]) => +percentageA < +percentageB)
      return (
        <div>
          <img className="mw-100" src={url} alt="ancestry_map" />
          <ul className="list-group">
            {ancestryGroups.map(([group, percentage], idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                {group}
                <span className="badge badge-primary badge-pill">{percentage}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    if (fetching) {
      return (
        <div>
          Fetching your ancestry results ...
        </div>
      )
    }
  }
}
