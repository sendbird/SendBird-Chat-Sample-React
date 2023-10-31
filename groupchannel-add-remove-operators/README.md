# Add and remove an operator in a group channel

This sample with UI components demonstrates how to add and remove an operator in a group channel on Sendbird Chat SDK for JavaScript on React.
Operators are users who can moderate channels by muting or banning users as well as freezing channels. To learn more, see our documentation on operators

![final_output](https://github.com/sendbird/sendbird-chat-sample-react/assets/104121286/e9bc5059-caa8-4ac1-b7b8-ae77ba75d1ec)

## Prerequisites

+ Node.js v10.13.0 or later

## How it works

By using `addOperators`/`addOperatorsWithUserIds` and `removeOperators`/`removeOperatorsWithUserIds` methods of `GroupChannel`, we can add and remove an operator in a group channel.

[ChannelInformation.js](./src/components/ChannelInformation.js#L26-L42)
```javascript
useEffect(() => {
  const ops = members.filter(member => member.role === 'operator');
  setOperators(ops);
}, [members]);

const addOperator = async (userId) => {
  if (userId.trim() !== "") {
    await channel.addOperators([userId]);
    const updatedOperators = [...operators, members.find(m => m.userId === userId)];
    setOperators(updatedOperators);
  }
  setAddingOperatorModalOpen(false);
};

const removeOperator = async (userId) => {
  await channel.removeOperators([userId]);
  const updatedOperators = operators.filter(op => op.userId !== userId);
  setOperators(updatedOperators);
};

<ConfirmationModal
  isOpen={isAddingOperatorModalOpen}
  onRequestClose={handleAddingOperatorCloseModal}
  onConfirm={addOperator}
  title="Add a operator"
  message={""}
  isUpdateMessage={true}
/>

<AccordionItem
  Icon={Members}
  title="Operators"
  onActionBtnClick={() => setAddingOperatorModalOpen(true)}
  actionBtnLabel="Add Operator"
>
  {operators.map((operator) => (
    <div className="member-item" key={operator.userId}>
      {operator.nickname}({operator.userId})
      <Close onClick={() => removeOperator(operator.userId)} className="close-icon"/>
    </div>
  ))}
</AccordionItem>
```

When the operator status of the member is changed, channel event(`onOperatorUpdated`) handler is triggered and the `ChannelInformation` component is re-rendered.

[ChannelList.js](./src/components/ChannelList.js#L114-L118)
```javascript
const channelHandler = new GroupChannelHandler({
  onOperatorUpdated: (channel) => {
    if (_channel.url === channel.url) {
      setMembers([...channel.members]);
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
