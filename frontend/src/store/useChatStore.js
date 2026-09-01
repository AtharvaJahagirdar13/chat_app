import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance, getApiErrorMessage } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

let messageRequestSequence = 0;
let conversationRequestSequence = 0;
let searchRequestSequence = 0;
let activeMessageHandler = null;

const idOf = (value) => (value?._id ?? value)?.toString();

export const getConversationPartner = (conversation, authUserId) =>
  conversation?.participants?.find((participant) => idOf(participant) !== idOf(authUserId));

const appendUniqueMessage = (messages, newMessage) => {
  if (newMessage?._id && messages.some((message) => message._id === newMessage._id)) {
    return messages;
  }
  return [...messages, newMessage];
};

const conversationTime = (conversation) =>
  new Date(conversation.lastMessageAt || conversation.createdAt || 0).getTime();

const sortConversations = (conversations) =>
  [...conversations].sort((left, right) => {
    const timeDifference = conversationTime(right) - conversationTime(left);
    return timeDifference || right._id.localeCompare(left._id);
  });

const upsertConversation = (conversations, conversation) =>
  sortConversations([
    conversation,
    ...conversations.filter((item) => item._id !== conversation._id),
  ]);

const applyLatestMessage = (conversation, message) => ({
  ...conversation,
  lastMessageId: message,
  lastMessageAt: message.createdAt,
});

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  selectedConversation: null,
  userSearchResults: [],
  isConversationsLoading: false,
  isMessagesLoading: false,
  isUserSearchLoading: false,
  isStartingConversation: false,

  getConversations: async ({ silent = false } = {}) => {
    const requestId = ++conversationRequestSequence;
    if (!silent) set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      if (requestId !== conversationRequestSequence) return;
      set((state) => {
        const selectedConversation = state.selectedConversation
          ? res.data.find((conversation) => conversation._id === state.selectedConversation._id) ||
            state.selectedConversation
          : null;
        return { conversations: sortConversations(res.data), selectedConversation };
      });
    } catch (error) {
      if (requestId !== conversationRequestSequence) return;
      if (!silent) toast.error(getApiErrorMessage(error, "Failed to load conversations"));
    } finally {
      if (!silent && requestId === conversationRequestSequence) {
        set({ isConversationsLoading: false });
      }
    }
  },

  selectConversation: (conversation) => {
    messageRequestSequence += 1;
    set({
      selectedConversation: conversation,
      messages: [],
      isMessagesLoading: Boolean(conversation),
    });
  },

  searchUsers: async (query) => {
    const requestId = ++searchRequestSequence;
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      set({ userSearchResults: [], isUserSearchLoading: false });
      return;
    }

    set({ isUserSearchLoading: true });
    try {
      const res = await axiosInstance.get("/users/search", { params: { q: normalizedQuery } });
      if (requestId !== searchRequestSequence) return;
      set({ userSearchResults: res.data });
    } catch (error) {
      if (requestId !== searchRequestSequence) return;
      toast.error(getApiErrorMessage(error, "Failed to search users"));
    } finally {
      if (requestId === searchRequestSequence) set({ isUserSearchLoading: false });
    }
  },

  clearUserSearch: () => {
    searchRequestSequence += 1;
    set({ userSearchResults: [], isUserSearchLoading: false });
  },

  startDirectConversation: async (participantId) => {
    set({ isStartingConversation: true });
    try {
      const res = await axiosInstance.post("/conversations/direct", { participantId });
      messageRequestSequence += 1;
      set((state) => ({
        conversations: upsertConversation(state.conversations, res.data),
        selectedConversation: res.data,
        messages: [],
        userSearchResults: [],
        isMessagesLoading: true,
      }));
      return res.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to start conversation"));
      throw error;
    } finally {
      set({ isStartingConversation: false });
    }
  },

  getMessages: async (conversationId) => {
    const requestId = ++messageRequestSequence;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/conversations/${conversationId}/messages`);
      if (requestId !== messageRequestSequence) return;
      set((state) => {
        if (state.selectedConversation?._id !== conversationId) return state;
        return { messages: res.data };
      });
    } catch (error) {
      if (requestId !== messageRequestSequence) return;
      toast.error(getApiErrorMessage(error, "Failed to load messages"));
    } finally {
      if (requestId === messageRequestSequence) set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (conversationId, messageData) => {
    try {
      const res = await axiosInstance.post(
        `/conversations/${conversationId}/messages`,
        messageData
      );
      set((state) => {
        const conversations = state.conversations.map((conversation) =>
          conversation._id === conversationId
            ? applyLatestMessage(conversation, res.data)
            : conversation
        );
        return {
          conversations: sortConversations(conversations),
          messages:
            state.selectedConversation?._id === conversationId
              ? appendUniqueMessage(state.messages, res.data)
              : state.messages,
        };
      });
      return res.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send message"));
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    if (activeMessageHandler) socket.off("newMessage", activeMessageHandler);

    activeMessageHandler = (newMessage) => {
      const conversationId = idOf(newMessage.conversationId);
      let foundConversation = false;
      set((state) => {
        foundConversation = state.conversations.some(
          (conversation) => conversation._id === conversationId
        );
        const conversations = state.conversations.map((conversation) =>
          conversation._id === conversationId
            ? applyLatestMessage(conversation, newMessage)
            : conversation
        );
        return {
          conversations: sortConversations(conversations),
          messages:
            state.selectedConversation?._id === conversationId
              ? appendUniqueMessage(state.messages, newMessage)
              : state.messages,
        };
      });
      if (!foundConversation) void get().getConversations({ silent: true });
    };

    socket.on("newMessage", activeMessageHandler);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && activeMessageHandler) socket.off("newMessage", activeMessageHandler);
    activeMessageHandler = null;
  },

  reset: () => {
    messageRequestSequence += 1;
    conversationRequestSequence += 1;
    searchRequestSequence += 1;
    get().unsubscribeFromMessages();
    set({
      messages: [],
      conversations: [],
      selectedConversation: null,
      userSearchResults: [],
      isConversationsLoading: false,
      isMessagesLoading: false,
      isUserSearchLoading: false,
      isStartingConversation: false,
    });
  },
}));
