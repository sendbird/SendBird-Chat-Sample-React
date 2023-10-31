# Freeze or unfreeze a group channel

This code sample with UI components demonstrates how to [freeze or unfreeze](https://sendbird.com/docs/chat/sdk/v4/javascript/channel/moderating-a-channel/freeze-and-unfreeze-a-channel#1-freeze-and-unfreeze-a-channel) a group channel on Sendbird Chat SDK for Android. Freezing a group channel is part of moderation. When a channel is frozen, only the [operators](https://sendbird.com/docs/chat/v4/android/user/overview-user#2-user-types-3-operator) can send messages to the channel and users aren't allowed to chat.

![final_output](https://github.com/sendbird/sendbird-chat-sample-react/assets/104121286/526326a0-e4df-4aca-b7cb-e926110878a8)

## Prerequisites

+ Node.js v10.13.0 or later

## How it works

You can freeze or unfreeze a group channel by calling the `freeze()` and `unfreeze()` methods.

[ChannelInformation.js](./src/components/ChannelInformation.js#L99-L103)
```javascript
if (isFrozen) {
  await channel.unfreeze();
} else {
  await channel.freeze();
}
```

And you can receive the event when the channel is frozen or unfrozen by adding a `ChannelHandler` to the channel.

[ChannelList.js](./src/components/ChannelList.js#L115-L124)
```javascript
const channelHandler = new GroupChannelHandler({
  onChannelFrozen: (channel) => {
    if (_channel.url === channel.url) {
      setIsFrozen(channel.isFrozen);
    }
  },
  onChannelUnfrozen: (channel) => {
    if (_channel.url === channel.url) {
      setIsFrozen(channel.isFrozen);
    }
  }
});
```

## How to run

Copy and paste the following code into Terminal.

``` bash
npm install
npm start
```
