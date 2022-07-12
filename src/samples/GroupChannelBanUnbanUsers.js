
import { useState, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import SendbirdChat from '@sendbird/chat';
import {
    GroupChannelHandler,
    GroupChannelModule,
} from '@sendbird/chat/groupChannel';

import { SENDBIRD_INFO } from '../constants/constants';
import { timestampToTime, handleKeyPress } from '../utils/messageUtils';
let sb;

const GroupChannelBanUnbanUsers = (props) => {

    const [state, updateState] = useState({
        applicationUsers: [],
        groupChannelMembers: [],
        currentlyJoinedChannel: null,
        messages: [],
        channels: [],
        members: [],
        bannedMembers: [],
        messageInputValue: "",
        userNameInputValue: "",
        userIdInputValue: "",
        channelNameUpdateValue: "",
        settingUpUser: true,
        file: null,
        messageToUpdate: null,
        loading: false,
        error: false,
        userIsOperator: false
    });

    //need to access state in message received callback
    const stateRef = useRef();
    stateRef.current = state;

    const channelRef = useRef();

    const scrollToBottom = (item, smooth) => {
        item?.scrollTo({
            top: item.scrollHeight,
            behavior: smooth
        })
    }

    useEffect(() => {
        scrollToBottom(channelRef.current)
    }, [state.currentlyJoinedChannel])

    useEffect(() => {
        scrollToBottom(channelRef.current, 'smooth')
    }, [state.messages])

    const onError = (error) => {
        updateState({ ...state, error: error.message });
        console.log(error);
    }

    const handleJoinChannel = async (channelUrl) => {
        if (state.currentlyJoinedChannel?.url === channelUrl) {
            return null;
        }
        const { channels, userIdInputValue } = state;
        updateState({ ...state, loading: true });
        const channel = channels.find((channel) => channel.url === channelUrl);
        const [messages, error] = await joinChannel(channel);
        if (error) {
            return onError(error);
        }

        const memberIndex = channel.members.findIndex((item => item.userId === userIdInputValue));
        const userIsOperator = channel.members[memberIndex].role === "operator";
        const bannedMembers = (channel.myRole === "operator") ? await getBannedMembers(channel) : [];

        // listen for incoming messages
        const channelHandler = new GroupChannelHandler();
        channelHandler.onUserJoined = () => { };
        channelHandler.onChannelChanged = () => { };
        channelHandler.onMessageUpdated = (channel, message) => {
            const messageIndex = stateRef.current.messages.findIndex((item => item.messageId == message.messageId));
            const updatedMessages = [...stateRef.current.messages];
            updatedMessages[messageIndex] = message;
            updateState({ ...stateRef.current, messages: updatedMessages });
        }

        channelHandler.onMessageReceived = (channel, message) => {
            const updatedMessages = [...stateRef.current.messages, message];
            updateState({ ...stateRef.current, messages: updatedMessages });
        };

        channelHandler.onMessageDeleted = (channel, message) => {
            const updatedMessages = stateRef.current.messages.filter((messageObject) => {
                return messageObject.messageId !== message;
            });
            updateState({ ...stateRef.current, messages: updatedMessages });
        };
        sb.groupChannel.addGroupChannelHandler(uuid(), channelHandler);
        
        updateState({ ...state, currentlyJoinedChannel: channel, messages: messages, loading: false, members: channel.members, userIsOperator: userIsOperator, bannedMembers: bannedMembers });
    }

    const handleLeaveChannel = async () => {
        const { currentlyJoinedChannel } = state;
        await currentlyJoinedChannel.leave();

        updateState({ ...state, currentlyJoinedChannel: null })
    }

    const handleCreateChannel = async (channelName = "testChannel",) => {
        const [groupChannel, error] = await createChannel(channelName, state.groupChannelMembers);
        if (error) {
            return onError(error);
        }

        const updatedChannels = [groupChannel, ...state.channels];
        updateState({ ...state, channels: updatedChannels, applicationUsers: [] });
    }

    const handleUpdateChannelMembersList = async () => {
        const { currentlyJoinedChannel, groupChannelMembers } = state;
        await inviteUsersToChannel(currentlyJoinedChannel, groupChannelMembers);
        updateState({ ...state, applicationUsers: [] });
    }

    const handleDeleteChannel = async (channelUrl) => {
        const [channel, error] = await deleteChannel(channelUrl);
        if (error) {
            return onError(error);
        }
        const updatedChannels = state.channels.filter((channel) => {
            return channel.url !== channelUrl;
        });
        updateState({ ...state, channels: updatedChannels });
    }


    const handleMemberInvite = async () => {
        const [users, error] = await getAllApplicationUsers();
        if (error) {
            return onError(error);
        }
        updateState({ ...state, applicationUsers: users });
    }


    const onUserNameInputChange = (e) => {
        const userNameInputValue = e.currentTarget.value;
        updateState({ ...state, userNameInputValue });
    }

    const onUserIdInputChange = (e) => {
        const userIdInputValue = e.currentTarget.value;
        updateState({ ...state, userIdInputValue });
    }


    const onMessageInputChange = (e) => {
        const messageInputValue = e.currentTarget.value;
        updateState({ ...state, messageInputValue });
    }

    const sendMessage = async () => {
        const { messageToUpdate, currentlyJoinedChannel, messages } = state;
        if (messageToUpdate) {
            const userMessageUpdateParams = {};
            userMessageUpdateParams.message = state.messageInputValue;
            const updatedMessage = await currentlyJoinedChannel.updateUserMessage(messageToUpdate.messageId, userMessageUpdateParams)
            const messageIndex = messages.findIndex((item => item.messageId == messageToUpdate.messageId));
            messages[messageIndex] = updatedMessage;
            updateState({ ...state, messages: messages, messageInputValue: "", messageToUpdate: null });
        } else {
            const userMessageParams = {};
            userMessageParams.message = state.messageInputValue;
            currentlyJoinedChannel.sendUserMessage(userMessageParams)
                .onSucceeded((message) => {
                    const updatedMessages = [...messages, message];

                    updateState({ ...state, messages: updatedMessages, messageInputValue: "" });
                })
                .onFailed((error) => {
                    console.log(error)
                    console.log("failed")
                });
        }
    }

    const onFileInputChange = async (e) => {
        if (e.currentTarget.files && e.currentTarget.files.length > 0) {
            const { currentlyJoinedChannel, messages } = state;
            const fileMessageParams = {};
            fileMessageParams.file = e.currentTarget.files[0];
            currentlyJoinedChannel.sendFileMessage(fileMessageParams)
                .onSucceeded((message) => {
                    const updatedMessages = [...messages, message];
                    updateState({ ...state, messages: updatedMessages, messageInputValue: "", file: null });
                })
                .onFailed((error) => {
                    console.log(error)
                    console.log("failed")
                });
        }
    }

    const handleDeleteMessage = async (messageToDelete) => {
      const { currentlyJoinedChannel } = state;
      await deleteMessage(currentlyJoinedChannel, messageToDelete); // Delete
    }

    const updateMessage = async (message) => {
        updateState({ ...state, messageToUpdate: message, messageInputValue: message.message });
    }

    const handleLoadMemberSelectionList = async () => {
        updateState({ ...state, currentlyJoinedChannel: null });
        const [users, error] = await getAllApplicationUsers();
        if (error) {
            return onError(error);
        }
        updateState({ ...state, currentlyJoinedChannel: null, applicationUsers: users, groupChannelMembers: [sb.currentUser.userId] });
    }

    const addToChannelMembersList = (userId) => {
        const groupChannelMembers = [...state.groupChannelMembers, userId];
        updateState({ ...state, groupChannelMembers: groupChannelMembers });
    }

    const setupUser = async () => {
        const { userNameInputValue, userIdInputValue } = state;
        const sendbirdChat = await SendbirdChat.init({
            appId: SENDBIRD_INFO.appId,
            localCacheEnabled: false,
            modules: [new GroupChannelModule()]
        });

        await sendbirdChat.connect(userIdInputValue);
        await sendbirdChat.setChannelInvitationPreference(true);

        const userUpdateParams = {};
        userUpdateParams.nickname = userNameInputValue;
        userUpdateParams.userId = userIdInputValue;
        await sendbirdChat.updateCurrentUserInfo(userUpdateParams);

        sb = sendbirdChat;
        updateState({ ...state, loading: true });
        const [channels, error] = await loadChannels();
        if (error) {
            return onError(error);
        }

        updateState({ ...state, channels: channels, loading: false, settingUpUser: false });
    }

    const handleOperator = async (callbackName, member) => {
        const { currentlyJoinedChannel, members } = state;

        try {
            await currentlyJoinedChannel[callbackName]([member.userId]);
            updateState({ ...state, members: members })
        } catch (error) {
            console.log("Error");
            console.log(error);
        }
    }

    const registerUnregisterAnOperator = (member) => {
        if(member.role === "operator") {
            handleOperator("removeOperators", member);
            alert("Operator was unregister");
        } else {
            handleOperator("addOperators", member);
            alert("Operator was register");
        }
    }

    const banUnbanUser = async (member, index, callbackName) => {
      const { currentlyJoinedChannel, members } = state;
      const updateMembers = members.slice();

      if(currentlyJoinedChannel.myRole === "operator") {
        try {
          if(callbackName === "ban") {
            await currentlyJoinedChannel.banUser(member, 1000000, "just banned");
            updateMembers.splice(index, 1)
          } else {
            await currentlyJoinedChannel.unbanUser(member);
          }
        } catch (error) {
            console.log("Error");
            console.log(error);
        }

        const bannedMembers = await getBannedMembers(currentlyJoinedChannel);

        updateState({ ...state, bannedMembers: bannedMembers, members: updateMembers });
      }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage()
        }
    }

    if (state.loading) {
        return <div>Loading...</div>
    }

    if (state.error) {
        return <div className="error">{state.error} check console for more information.</div>
    }

    console.log('- - - - State object very useful for debugging - - - -');
    console.log(state);

    return (
        <>
            <CreateUserForm
                setupUser={setupUser}
                userNameInputValue={state.userNameInputValue}
                userIdInputValue={state.userIdInputValue}
                settingUpUser={state.settingUpUser}
                onUserIdInputChange={onUserIdInputChange}
                onUserNameInputChange={onUserNameInputChange} />
            <ChannelList
                channels={state.channels}
                handleJoinChannel={handleJoinChannel}
                handleCreateChannel={handleLoadMemberSelectionList}
                handleDeleteChannel={handleDeleteChannel}
                handleLoadMemberSelectionList={handleLoadMemberSelectionList} />
            <MembersSelect
                applicationUsers={state.applicationUsers}
                groupChannelMembers={state.groupChannelMembers}
                currentlyJoinedChannel={state.currentlyJoinedChannel}
                addToChannelMembersList={addToChannelMembersList}
                handleCreateChannel={handleCreateChannel}
                handleUpdateChannelMembersList={handleUpdateChannelMembersList}
            />

            <Channel
                currentlyJoinedChannel={state.currentlyJoinedChannel}
                handleLeaveChannel={handleLeaveChannel}
                channelRef={channelRef}
            >
                <MessagesList
                    messages={state.messages}
                    handleDeleteMessage={handleDeleteMessage}
                    updateMessage={updateMessage}
                />
                <MessageInput
                    value={state.messageInputValue}
                    onChange={onMessageInputChange}
                    sendMessage={sendMessage}
                    fileSelected={state.file}
                    onFileInputChange={onFileInputChange}
                    handleKeyDown={handleKeyDown} />
            </Channel>
            <MembersList
                members={state.members}
                userIdInputValue={state.userIdInputValue}
                userIsOperator={state.userIsOperator}
                bannedMembers={state.bannedMembers}
                registerUnregisterAnOperator={registerUnregisterAnOperator}
                banUnbanUser={banUnbanUser}
                handleMemberInvite={handleMemberInvite}
            />
        </>
    );
};

// Chat UI Components
const ChannelList = ({
    channels,
    handleJoinChannel,
    handleDeleteChannel,
    handleLoadMemberSelectionList
}) => {
    return (
        <div className='channel-list'>
            <div className="channel-type">
                <h1>Group Channels</h1>
                <button className="channel-create-button" onClick={() => handleLoadMemberSelectionList()}>Create Channel</button>
            </div>
            {channels.map(channel => {
                return (
                    <div key={channel.url} className="channel-list-item" >
                        <div
                            className="channel-list-item-name"
                            onClick={() => { handleJoinChannel(channel.url) }}>
                            <ChannelName members={channel.members} />
                            <div className="last-message">{channel.lastMessage?.message}</div>
                        </div>
                        <div>
                            <button className="control-button" onClick={() => handleDeleteChannel(channel.url)}>
                                <img className="channel-icon" src='/icon_delete.png' />
                            </button>
                        </div>
                    </div>);
            })}
        </div >);
}

const ChannelName = ({ members }) => {
    const membersToDisplay = members.slice(0, 2);
    const membersNotToDisplay = members.slice(2);

    return <>
        {membersToDisplay.map((member) => {
            return <span key={member.userId}>{member.nickname} </span>
        })}
        {membersNotToDisplay.length > 0 && `+ ${membersNotToDisplay.length}`}
    </>
}


const Channel = ({ currentlyJoinedChannel, children, handleLeaveChannel, channelRef }) => {
    if (currentlyJoinedChannel) {
        return <div className="channel" ref={channelRef}>
            <ChannelHeader>{currentlyJoinedChannel.name}</ChannelHeader>
            <div>
                <button className="leave-channel" onClick={handleLeaveChannel}>Leave Channel</button>
            </div>
            <div>{children}</div>
        </div>;

    }
    return <div className="channel"></div>;
}

const ChannelHeader = ({ children }) => {
    return <div className="channel-header">{children}</div>;
}

const MembersList = ({ members, handleMemberInvite, registerUnregisterAnOperator, userIsOperator, userIdInputValue, banUnbanUser, bannedMembers }) => {
    if (members.length > 0) {
        return <div className="members-list">
            <button onClick={handleMemberInvite}>Invite</button>
            {members.map((member, index) => {
              const isOperator = (member.role === "operator");
              const memberIsSender = (member.userId !== userIdInputValue);
              return(
                <div key={member.userId}>
                  {userIsOperator && <div key={member.userId} className="member-item-wrapper">
                    <div className="member-item">
                      {member.nickname}
                      {isOperator && <img className="message-icon" src='/operator_icon.png' />}
                    </div>
                    {memberIsSender &&
                      <>
                        <button className="member-list-btn" onClick={() => registerUnregisterAnOperator(member)}>
                          {isOperator ? "Unregister as operator" : "Register as operator"}
                        </button>
                        <button className="member-list-btn" onClick={() => banUnbanUser(member, index, "ban")}>Ban</button>
                      </>}
                  </div>}
                  {!userIsOperator && <div className="member-item">{member.nickname}</div>}
                </div>
              )
            })}
            {(bannedMembers.length !== 0) && <div>
              <h3>Banned users</h3>
              {bannedMembers.map((member, index) => {
                return(<div key={member.userId} className="member-item-wrapper">
                  <div className="member-item">{member.nickname}</div>
                  <button className="member-list-btn" onClick={() => banUnbanUser(member, index, "unban")}>Unban</button>
                </div>)
              })}
            </div>}
        </div>;
    } else {
        return null;
    }
}

const MessagesList = ({ messages, handleDeleteMessage, updateMessage }) => {
    return <div className="message-list">
        {messages.map(message => {
            const messageSentByYou = message.sender.userId === sb.currentUser.userId;

            return (
                <div key={message.messageId} className={`message-item ${messageSentByYou ? 'message-from-you' : ''}`}>
                    <Message
                        message={message}
                        handleDeleteMessage={handleDeleteMessage}
                        updateMessage={updateMessage}
                        messageSentByYou={messageSentByYou} />
                    <ProfileImage user={message.sender} />
                </div>);
        })}
    </div >
}

const Message = ({ message, updateMessage, handleDeleteMessage, messageSentByYou }) => {
    if (message.url) {
        return (
            <div className={`message  ${messageSentByYou ? 'message-from-you' : ''}`}>
                <div className="message-user-info">
                    <div className="message-sender-name">{message.sender.nickname}{' '}</div>
                    <div>{timestampToTime(message.createdAt)}</div>
                </div>
                <img src={message.url} />
            </div >);
    }
    const messageSentByCurrentUser = message.sender.userId === sb.currentUser.userId;

    return (
        <div className={`message  ${messageSentByYou ? 'message-from-you' : ''}`}>
            <div className="message-info">
                <div className="message-user-info">
                    <div className="message-sender-name">{message.sender.nickname}{' '}</div>
                    <div>{timestampToTime(message.createdAt)}</div>
                </div>
                {messageSentByCurrentUser &&
                    <div>
                        <button className="control-button" onClick={() => updateMessage(message)}><img className="message-icon" src='/icon_edit.png' /></button>
                        <button className="control-button" onClick={() => handleDeleteMessage(message)}><img className="message-icon" src='/icon_delete.png' /></button>
                    </div>}
            </div>
            <div>{message.message}</div>
        </div >
    );

}

const ProfileImage = ({ user }) => {
    if (user.plainProfileUrl) {
        return <img className="profile-image" src={user.plainProfileUrl} />
    } else {
        return <div className="profile-image-fallback">{user.nickname.charAt(0)}</div>;
    }
}

const MessageInput = ({ value, onChange, sendMessage, onFileInputChange, handleKeyDown }) => {
    return (
        <div className="message-input">
            <input
                placeholder="write a message"
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown} />

            <div className="message-input-buttons">
                <button className="send-message-button" onClick={sendMessage}>Send Message</button>
                <label className="file-upload-label" htmlFor="upload" >Select File</label>

                <input
                    id="upload"
                    className="file-upload-button"
                    type='file'
                    hidden={true}
                    onChange={onFileInputChange}
                    onClick={() => { }}
                />
            </div>
        </div>);
}

const MembersSelect = ({
    applicationUsers,
    groupChannelMembers,
    currentlyJoinedChannel,
    addToChannelMembersList,
    handleCreateChannel,
    handleUpdateChannelMembersList

}) => {
    if (applicationUsers.length > 0) {
        return <div className="overlay">
            <div className="overlay-content">
                <button onClick={() => {
                    if (currentlyJoinedChannel) {
                        handleUpdateChannelMembersList();
                    } else {
                        handleCreateChannel();
                    }
                }}>{currentlyJoinedChannel ? 'Submit' : 'Create'}</button>
                {applicationUsers.map((user) => {
                    const userSelected = groupChannelMembers.some((member) => member === user.userId);
                    return <div
                        key={user.userId}
                        className={`member-item ${userSelected ? 'member-selected' : ''}`}
                        onClick={() => addToChannelMembersList(user.userId)}>
                        <ProfileImage user={user} />
                        <div className="member-item-name">{user.nickname}</div>
                    </div>
                })}

            </div>
        </div >;
    }
    return null;
}

const CreateUserForm = ({
    setupUser,
    settingUpUser,
    userNameInputValue,
    userIdInputValue,
    onUserNameInputChange,
    onUserIdInputChange
}) => {
    if (settingUpUser) {
        return <div className="overlay">
            <div className="overlay-content" onKeyDown={(event) => handleKeyPress(event, setupUser)}>
                <div>User ID</div>

                <input
                    onChange={onUserIdInputChange}
                    className="form-input"
                    type="text" value={userIdInputValue} />

                <div>User Nickname</div>
                <input
                    onChange={onUserNameInputChange}
                    className="form-input"
                    type="text" value={userNameInputValue} />

                <button
                    className="user-submit-button"
                    onClick={setupUser}>Connect</button>
            </div>
        </div>


    } else {
        return null;
    }

}

// Helpful functions that call Sendbird
const loadChannels = async () => {
    try {
        const groupChannelQuery = sb.groupChannel.createMyGroupChannelListQuery({ limit: 30, includeEmpty: true });
        const channels = await groupChannelQuery.next();
        return [channels, null];
    } catch (error) {
        return [null, error];
    }
}

const joinChannel = async (channel) => {
    try {
        const messageListParams = {};
        messageListParams.nextResultSize = 20;
        const messages = await channel.getMessagesByTimestamp(0, messageListParams);
        return [messages, null];
    } catch (error) {
        return [null, error];
    }
}

const inviteUsersToChannel = async (channel, userIds) => {
    await channel.inviteWithUserIds(userIds);
}

const createChannel = async (channelName, userIdsToInvite) => {
    try {
        const groupChannelParams = {};
        groupChannelParams.addUserIds = userIdsToInvite;
        groupChannelParams.name = channelName;
        groupChannelParams.operatorUserIds = userIdsToInvite;
        const groupChannel = await sb.groupChannel.createChannel(groupChannelParams);
        return [groupChannel, null];
    } catch (error) {
        return [null, error];
    }
}

const deleteChannel = async (channelUrl) => {
    try {
        const channel = await sb.groupChannel.getChannel(channelUrl);
        await channel.delete();
        return [channel, null];
    } catch (error) {
        return [null, error];
    }
}

const deleteMessage = async (currentlyJoinedChannel, messageToDelete) => {
    await currentlyJoinedChannel.deleteMessage(messageToDelete);
}

const getAllApplicationUsers = async () => {
    try {
        const userQuery = sb.createApplicationUserListQuery({ limit: 100 });
        const users = await userQuery.next();
        return [users, null];
    } catch (error) {
        return [null, error];
    }
}

const getBannedMembers = async (channel) => {
  try {
    const listQuery = channel.createBannedUserListQuery();
    const bannedMembers = await listQuery.next();

    return bannedMembers;
  } catch (error) {
    console.log("Error");
    console.log(error);
  }
}

export default GroupChannelBanUnbanUsers;
