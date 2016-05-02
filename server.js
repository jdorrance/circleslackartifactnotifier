'use strict';
var Slack, _, app, connect, debug, format, getFromAPI, http, request, server;

connect = require('connect');

request = require('request');

_ = require('lodash');

http = require('http');

debug = require('debug')('wh');

app = connect();

Slack = require('node-slack');

app.use(require('body-parser').json());

format = function(input) {
  return JSON.stringify(input, null, 2);
};

getFromAPI = function(_url, cb) {
  return request({
    url: _url,
    json: true
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      return cb(null, body);
    } else {
      return cb(error);
    }
  });
};

app.use(function(req, res) {
  var latestArtifactsURL, payload, ref, slackwebhookurl;
  debug('incoming webhook', req.method, req.url, format(req.body));
  payload = (ref = req.body) != null ? ref.payload : void 0;
  latestArtifactsURL = "https://circleci.com/api/v1/project/jdorrance/scc-aem-foundation/" + payload.build_num + "/artifacts?circle-token=4c531db48d36e9586ff0f10b6d69bed840242dad";
  slackwebhookurl = "https://hooks.slack.com/services/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";
  return getFromAPI(latestArtifactsURL, function(error, response) {
    var attachments, commits, emojiMap, message;
    attachments = _(response).map(function(appCodeObj, index) {
      var ref1;
      return {
        'fallback': "Artifact " + ((index + 1).toString()),
        'title': 'Artifact #' + (index + 1).toString() + ' (' + _.last(appCodeObj != null ? (ref1 = appCodeObj.url) != null ? ref1.split('/') : void 0 : void 0) + ')',
        'title_link': appCodeObj.url
      };
    }).value();
    commits = _(payload.all_commit_details).map(function(val) {
      return "- " + val.subject + " (`<" + val.commit_url + "|" + (val.commit.substring(0, 8)) + ">` by " + val.committer_login + ")";
    }).value().join('\n');
    message = "*Circle CI Build #*<" + payload.build_url + "|" + (payload.build_num.toString()) + "> *" + payload.status + "*\n" + commits;
    emojiMap = {
      'canceled': ':rage',
      'infrastructure_fail': ':rage:',
      'timedout': ':rage:',
      'no_tests': ':rage:',
      'failed': ':rage:',
      'running': ':running:',
      'success': ':sunglasses:'
    };
    new Slack(slackwebhookurl, {}).send({
      text: message,
      channel: "#general",
      username: "AEMBot",
      attachments: attachments,
      icon_emoji: emojiMap[payload.outcome]
    });
    res.end('OK\n');
  });
});

server = http.createServer(app);

server.on('error', function(err) {
  debug('server error', err);
});

server.listen(80, function() {
  debug('Respoke webhook server is listening on port', 80);
});
