# circleslackartifactnotifier

A node module for publishing the latest results (artifacts) from a CircleCI build into a Slack room

[Slack](https://slack.com/) is a messaging platform that is easy to integrate with.
This module should be useful for creating various integrations with Slack, such as
chat bots!

## Install Notifier

circleslackartifactnotifier is available via npm:

```
npm install circleslackartifactnotifier
```


Get your hook_url from the Slack Incoming Webhooks Integration page.

```
var Notifier = require('circleslackartifactnotifier');
var notifier = new Notifier(options);
```

To send a message, call notifier.notify:

```
notifier.notify();
```

Options are as follows 
```

var notifier = new Notifier({
	"username" : {YOUR_CIRCLE_CI_USERNAME},
	"projectname" : {YOUR_CIRCLE_CI_PROJECT_NAME},
	"circlecitoken" : {CIRCLE_CI_TOKEN},
	"slackwebhookurl" : {SLACK_WEB_HOOK_URL}
});
```
