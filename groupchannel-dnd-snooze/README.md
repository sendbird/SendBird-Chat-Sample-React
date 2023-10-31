# Set up Do Not Disturb and snooze mode in a group channel

This code sample with UI components demonstrates how to use [Do Not Disturb (DND) and snooze](https://sendbird.com/docs/chat/sdk/v4/javascript/push-notifications/configuring-preferences/push-notification-preferences#2-do-not-disturb) functionalities in a group channel on Sendbird Chat SDK for Javascript. While the DND mode mutes notifications from the SDK for a set period and repeats on a daily basis, snoozing blocks notifications for a set period and does not repeat.

![final_output](https://github.com/sendbird/sendbird-chat-sample-react/assets/104121286/7421d3c6-f0a3-4910-9da8-497360cc0f80)

## Prerequisites

+ Node.js v10.13.0 or later

## How it works

Do Not Disturb (DND) and snooze are part of the notification settings used to block notifications from a specific channel or a group of channels for a set period of time.

[ChannelList.js](./src/components/ChannelList.js#L29-L50)
``` javascript
if (selectedItem === "DND") {
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const start = new Date(startTimestamp);
  const startHour = start.getHours();
  const startMin = start.getMinutes();
  const end = new Date(endTimestamp);
  const endHour = end.getHours();
  const endMin = end.getMinutes();

  sb.setDoNotDisturb(true, startHour, startMin, endHour, endMin, currentTimeZone, (response, error) => {
    if (error) {
      console.log(error);
    }
  });
} else if (selectedItem === "Snooze") {
  sb.setSnoozePeriod(true, startTimestamp, endTimestamp, (response, error) => {
    if (error) {
      console.log(error);
    }
  });
}
```

## How to run

Copy and paste the following code into Terminal.

``` bash
npm install
npm start
```
