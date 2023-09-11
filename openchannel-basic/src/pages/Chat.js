import React, {useEffect, useState, useCallback} from 'react';
import ChannelList from '../components/ChannelList';
import ChannelHeader from '../components/ChannelHeader';
import MessageInput from '../components/MessageInput';
import MessageList from '../components/MessageList';
import MemberList from '../components/MemberList';

export default function Chat({sb, userId}) {
  const [channel, setChannel] = useState(null);
  const [channelHeaderName, setChannelHeaderName] = useState('Channel Name');
  const [messageList, setMessageList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [channelList, setChannelList] = useState([]);
  const [openQuery, setOpenQuery] = useState(sb.openChannel.createOpenChannelListQuery());
  const [isOperator, setIsOperator] = useState(false);

  const retrieveChannelList = useCallback(async () => {
    if (openQuery.hasNext) {
      setIsLoading(true);
      const result = await openQuery.next();
      setIsLoading(false);
      return result;
    } else {
      return [];
    }
  }, [openQuery, setIsLoading]);

  useEffect(() => {
    retrieveChannelList().then((channels) => {
      setChannelList(channels);
    });
  }, [retrieveChannelList, setChannelList]);

  return (
    <div className='container'>
      <ChannelList
        sb={sb}
        channel={channel}
        userId={userId}
        channelList={channelList}
        setChannel={setChannel}
        setChannelHeaderName={setChannelHeaderName}
        setMessageList={setMessageList}
        setChannelList={setChannelList}
        isLoading={isLoading}
        openQuery={openQuery}
        setOpenQuery={setOpenQuery}
        retrieveChannelList={retrieveChannelList}
        setIsOperator={setIsOperator}
      />
      {channel && (
        <div className="channel">
          <ChannelHeader
            channel={channel}
            channelHeaderName={channelHeaderName}
            setChannel={setChannel}
            setMessageList={setMessageList}
            channelList={channelList}
            setChannelList={setChannelList}
            userId={userId}
            isOperator={isOperator}
          />
          <div>
            <MessageList
              sb={sb}
              channel={channel}
              messageList={messageList}
              setMessageList={setMessageList}
            />
            <MessageInput
              sb={sb}
              messageList={messageList}
              channel={channel}
              setMessageList={setMessageList}
            />
          </div>
        </div>
      )}
      {channel && (
        <MemberList
          sb={sb}
          channel={channel}
        />
      )}
    </div>
  );
}
