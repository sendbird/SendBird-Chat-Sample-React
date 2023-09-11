import {GrDocumentUpload} from 'react-icons/gr';
import {AiOutlineSend} from 'react-icons/ai';
import {useState} from "react";

function MessageInput({sb, channel, messageList, setMessageList}) {
  const [textMessage, setTextMessage] = useState('');

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      sendMessage(textMessage);
      e.preventDefault();
    }
  }

  const onFileInputChange = async (e) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0) {
      const fileMessageParams = {};
      fileMessageParams.file = e.currentTarget.files[0];
      channel.sendFileMessage(fileMessageParams)
        .onPending((message) => {
          console.log("pending: ", message);
        })
        .onSucceeded((message) => {
          setMessageList([...messageList, message]);
        })
        .onFailed((error) => {
          console.log(error)
          console.log("failed")
        });
    }
  }

  function sendMessage(messageText) {
    const UserMessageCreateParams = {};
    UserMessageCreateParams.message = messageText;
    UserMessageCreateParams.sender = {nickname: sb.currentUser.nickname, userId: sb.currentUser.userId};
    if (channel) {
      setTextMessage('');  // Reset the input state after sending the message
      channel.sendUserMessage(UserMessageCreateParams)
        .onPending((message) => {
          console.log("pending: ", message);
        })
        .onFailed((error) => {
          console.log("error: ", error);
        })
        .onSucceeded((message) => {
          setMessageList([...messageList, message]);
        });
    } else {
      console.log("no channel");
      return null;
    }
  }

  return (
    <div className="message-input">
      <GrDocumentUpload
        htmlFor="upload"
        size="3em"
        className="add-file-button"
        style={{ paddingRight: "5px" }}
        onClick={() => document.getElementById('upload').click()}
      />
      <input
        id="upload"
        className="file-upload-button"
        type='file'
        hidden={true}
        onChange={onFileInputChange}
      />
      <input
        id='textMessage'
        type="text"
        value={textMessage}
        onChange={e => setTextMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div style={{paddingLeft:"5px"}}>
        <AiOutlineSend className="send-message-button" size="3em"
                       onClick={() => sendMessage(textMessage)}/>

      </div>
    </div>);
}

export default MessageInput;