export const canonicalDirectKey = (firstUserId, secondUserId) => {
  const participantIds = [firstUserId, secondUserId].map((id) => id?.toString());

  if (participantIds.some((id) => !id) || participantIds[0] === participantIds[1]) {
    throw new Error("Direct conversations require two distinct participants");
  }

  return participantIds.sort((left, right) => left.localeCompare(right)).join(":");
};

export const isConversationParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => {
    const participantId = participant?._id ?? participant;
    return participantId.toString() === userId.toString();
  });

const serializeParticipant = (participant) => ({
  _id: participant._id,
  fullName: participant.fullName,
  profilePic: participant.profilePic,
});

export const serializeConversation = (conversation) => ({
  _id: conversation._id,
  type: conversation.type,
  participants: conversation.participants.map(serializeParticipant),
  createdBy: conversation.createdBy,
  lastMessageId: conversation.lastMessageId
    ? {
        _id: conversation.lastMessageId._id,
        conversationId: conversation.lastMessageId.conversationId,
        senderId: conversation.lastMessageId.senderId,
        receiverId: conversation.lastMessageId.receiverId,
        text: conversation.lastMessageId.text,
        image: conversation.lastMessageId.image,
        createdAt: conversation.lastMessageId.createdAt,
      }
    : null,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});
