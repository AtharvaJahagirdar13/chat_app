import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { getConversationPartner, useChatStore } from "../store/useChatStore";
import NewChatModal from "./NewChatModal";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar = () => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const {
    conversations,
    getConversations,
    selectedConversation,
    selectConversation,
    isConversationsLoading,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();

  useEffect(() => {
    void getConversations();
  }, [getConversations]);

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="flex h-full w-20 flex-col border-r border-base-300 transition-all duration-200 lg:w-72">
        <div className="w-full border-b border-base-300 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessagesSquare className="size-6" />
              <span className="hidden font-medium lg:block">Conversations</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm btn-circle lg:btn-square"
              aria-label="New Chat"
              onClick={() => setIsNewChatOpen(true)}
            >
              <MessageSquarePlus className="size-4" />
              <span className="hidden lg:inline">New</span>
            </button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto py-3">
          {conversations.map((conversation) => {
            const partner = getConversationPartner(conversation, authUser?._id);
            if (!partner) return null;
            const isOnline = onlineUsers.includes(partner._id);
            const lastMessage = conversation.lastMessageId;
            return (
              <button
                type="button"
                key={conversation._id}
                onClick={() => selectConversation(conversation)}
                className={`flex w-full items-center gap-3 p-3 transition-colors hover:bg-base-300 ${
                  selectedConversation?._id === conversation._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }`}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={partner.profilePic || "/avatar.png"}
                    alt={partner.fullName}
                    className="size-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-zinc-900" />
                  )}
                </div>
                <div className="hidden min-w-0 text-left lg:block">
                  <div className="truncate font-medium">{partner.fullName}</div>
                  <div className="truncate text-sm text-zinc-400">
                    {lastMessage?.text || (lastMessage?.image ? "Image" : "No messages yet")}
                  </div>
                </div>
              </button>
            );
          })}

          {conversations.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">
              <span className="hidden lg:inline">No conversations yet</span>
              <MessagesSquare className="mx-auto size-5 lg:hidden" aria-label="No conversations yet" />
            </div>
          )}
        </div>
      </aside>
      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} />}
    </>
  );
};

export default Sidebar;
