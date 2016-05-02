request = require('request')
async = require('async')
_ = require('lodash')
Slack = require('node-slack')

getFromAPI = (_url, cb) ->
  request {url: _url, json: true}, (error, response, body) ->
    if !error and response.statusCode == 200
      cb null,body
    else
      cb error


Notifier = (options) ->
  this.opts = options
  unless @opts.channel then @opts.channel = '#general'
  unless @opts.botname then @opts.botname = 'CircleCIBot'
  @opts.latestArtifactsURL = "https://circleci.com/api/v1/project/#{@opts.username}/#{@opts.projectname}/latest/artifacts?circle-token=#{@opts.circlecitoken}"
  @opts.latestBuildURL = "https://circleci.com/api/v1/project/#{@opts.username}/#{@opts.projectname}?circle-token=#{@opts.circlecitoken}&limit=1"
  this

Notifier::notify = ->
  opts = this.opts
  async.map [opts.latestArtifactsURL,opts.latestBuildURL], getFromAPI, (err, results) ->
    if results.length >= 0
      latestBuild = if _.isArray(results[1]) then results[1][0] else results[1]
      old_path = opts.projectname + '/' + latestBuild.previous.build_num.toString()
      new_path = opts.projectname + '/' + latestBuild.build_num.toString()
      attachments = _(results[0]).map((appCodeObj, index) ->
        {
          'fallback': "Artifact #{(index + 1).toString()}"
          'title': 'Artifact #' + (index + 1).toString() + ' (' + _.last(appCodeObj.url.split('/')) + ')'
          'title_link': appCodeObj.url.replace(old_path, new_path)
        }
      ).value()
      commits = _(latestBuild.all_commit_details).map((val) -> "- #{val.subject} (`<#{val.commit_url}|#{val.commit.substring(0, 8)}>` by #{val.committer_login})").value().join('\n')
      message = "*Circle CI Build #*<#{latestBuild.build_url}|#{latestBuild.build_num.toString()}> *#{latestBuild.status}*\n#{commits}"
      slack = new Slack(opts.slackwebhookurl, {})

      emojiMap =
        'canceled': ':rage'
        'infrastructure_fail': ':rage:'
        'timedout': ':rage:'
        'no_tests': ':rage:'
        'failed': ':rage:'
        'running': ':running:'
        'success': ':sunglasses:'

      return slack.send(
        text: message
        channel: opts.channel
        username: opts.botname
        attachments: attachments
        icon_emoji: emojiMap[latestBuild.outcome])

module.exports = Notifier

notifier = new Notifier(
  'username': 'jdorrance'
  'projectname': 'scc-aem-foundation'
  'circlecitoken': '4c531db48d36e9586ff0f10b6d69bed840242dad'
  'slackwebhookurl': 'https://hooks.slack.com/services/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')
notifier.notify()