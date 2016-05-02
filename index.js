var request = require('request');
var async = require('async');
var _ = require('lodash');
var Slack = require('node-slack');

var getFromAPI = function(_url, cb){
    request({url:_url,json:true}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            cb(null,body);
        }else{
            cb(error);
        }
    });
};

function Notifier(options) {
  this.circleCIUser = options.username;
  this.circleCIPro = options.projectname;
  this.circleCIToken = options.circlecitoken;
  this.slackWebhookURL = options.slackwebhookurl;
  this.channel = "general";
  this.latestArtifactsURL = 'https://circleci.com/api/v1/project/'+ this.circleCIUser+ '/' + this.circleCIPro + '/latest/artifacts?circle-token=' + this.circleCIToken;
  this.latestBuildURL = 'https://circleci.com/api/v1/project/'+ this.circleCIUser+ '/' + this.circleCIPro + '?circle-token=' + this.circleCIToken+'&limit=1';
}
Notifier.prototype.notify  = function(){
	var _this = this;
async.map([_this.latestArtifactsURL,_this.latestBuildURL], getFromAPI, function(err,results){
    if(results.length >=0){
        var latestBuild = results[1];
        if(_.isArray(latestBuild)) latestBuild = latestBuild[0];

        var old_path =_this.circleCIPro + "/" + latestBuild.previous.build_num.toString();
        var new_path = _this.circleCIPro + "/" + latestBuild.build_num.toString();

        var attachments = _(results[0]).map(function(appCodeObj, index){
        	return {
	            "fallback": "Artifact #" + (index+1).toString(),
	            "title": "Artifact #" + (index+1).toString() + " (" + _.last(appCodeObj.url.split("/"))+ ")",
	            "title_link": appCodeObj.url.replace(old_path,new_path)
        	}
        }).value();

        var commits = _(latestBuild.all_commit_details).map(function(val, index){
            var str =  "- " +val.subject +" (`<" + val.commit_url + "|" + val.commit.substring(0,8) + ">` by " + val.committer_login + ")";
            return str;
        }).value().join("\n");

        var message ='*Circle CI Build #*' + '<' + latestBuild.build_url + '|' + latestBuild.build_num.toString() + '>' +
            ' *' + latestBuild.status +'*' +
            '\n' + commits ;
        var slack = new Slack(_this.slackWebhookURL,{});

        var emojiMap = {
            "canceled" : ":rage",
            "infrastructure_fail" : ":rage:",
            "timedout" : ":rage:",
            "no_tests" : ":rage:",
            "failed" : ":rage:",
            "running": ":running:",
            "success" : ":sunglasses:"
        };
        var emoji = emojiMap[latestBuild.outcome];
        return slack.send({
            text: message,
            channel: '#general',
            username: 'CircleCIBot',
            attachments: attachments,
            icon_emoji: emoji
        });
    }
});
}
module.exports = Notifier;