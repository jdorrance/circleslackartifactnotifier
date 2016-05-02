'use strict'
connect = require('connect')
request = require('request')
_ = require('lodash')
http = require('http')
debug = require('debug')('wh')
app = connect()
Slack = require('node-slack')

# Parse JSON requests into `req.body`.
app.use require('body-parser').json()

format = (input) -> JSON.stringify input, null, 2

getFromAPI = (_url, cb) ->
  request {url: _url, json: true}, (error, response, body) ->
    if !error and response.statusCode == 200
      cb null,body
    else
      cb error

# Print all incoming requests, then respond to them.
app.use (req, res) ->
  debug 'incoming webhook', req.method, req.url, format(req.body)
  payload = req.body?.payload
  latestArtifactsURL = "https://circleci.com/api/v1/project/jdorrance/scc-aem-foundation/#{payload.build_num}/artifacts?circle-token=4c531db48d36e9586ff0f10b6d69bed840242dad"
  slackwebhookurl = "https://hooks.slack.com/services/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"
  getFromAPI(latestArtifactsURL, (error, response) ->
    attachments = _(response).map((appCodeObj, index) ->
      {
        'fallback': "Artifact #{(index + 1).toString()}"
        'title': 'Artifact #' + (index + 1).toString() + ' (' + _.last(appCodeObj?.url?.split('/')) + ')'
        'title_link': appCodeObj.url
      }
    ).value()

    commits = _(payload.all_commit_details).map((val) -> "- #{val.subject} (`<#{val.commit_url}|#{val.commit.substring(0, 8)}>` by #{val.committer_login})").value().join('\n')
    message = "*Circle CI Build #*<#{payload.build_url}|#{payload.build_num.toString()}> *#{payload.status}*\n#{commits}"

    emojiMap =
    'canceled': ':rage'
    'infrastructure_fail': ':rage:'
    'timedout': ':rage:'
    'no_tests': ':rage:'
    'failed': ':rage:'
    'running': ':running:'
    'success': ':sunglasses:'

    new Slack(slackwebhookurl, {}).send(
      text: message
      channel: "#general"
      username: "AEMBot"
      attachments: attachments
      icon_emoji: emojiMap[payload.outcome]
    )

    res.end 'OK\n'
    return
  )

# create node.js http server and listen on port 3009
server = http.createServer(app)
server.on 'error', (err) ->
  debug 'server error', err
  return
server.listen 80, ->
  debug 'Respoke webhook server is listening on port', 80
  return