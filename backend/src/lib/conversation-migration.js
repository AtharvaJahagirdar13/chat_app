import { canonicalDirectKey } from "./conversation.js";

export const planLegacyMessages = ({ messages, validUserIds, existingConversations = [] }) => {
  const validUsers = new Set([...validUserIds].map((id) => id.toString()));
  const existingByKey = new Map(existingConversations.map((conversation) => [conversation.directKey, conversation]));
  const groupsByKey = new Map();
  const orphanMessages = [];

  for (const message of messages) {
    const senderId = message.senderId?.toString();
    const receiverId = message.receiverId?.toString();
    if (
      !senderId ||
      !receiverId ||
      senderId === receiverId ||
      !validUsers.has(senderId) ||
      !validUsers.has(receiverId)
    ) {
      orphanMessages.push(message);
      continue;
    }

    const directKey = canonicalDirectKey(senderId, receiverId);
    const group = groupsByKey.get(directKey) || {
      directKey,
      participants: directKey.split(":"),
      createdBy: senderId,
      messages: [],
    };
    group.messages.push(message);
    groupsByKey.set(directKey, group);
  }

  const groups = [...groupsByKey.values()];
  const messagesToUpdate = groups.reduce((count, group) => {
    const existingConversationId = existingByKey.get(group.directKey)?._id?.toString();
    return (
      count +
      group.messages.filter(
        (message) => !existingConversationId || message.conversationId?.toString() !== existingConversationId
      ).length
    );
  }, 0);

  return {
    groups,
    orphanMessages,
    report: {
      legacyMessages: messages.length,
      uniqueUserPairs: groups.length,
      conversationsToCreate: groups.filter((group) => !existingByKey.has(group.directKey)).length,
      messagesToUpdate,
      orphanRecords: orphanMessages.length,
    },
  };
};
