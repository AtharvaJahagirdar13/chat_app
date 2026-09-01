import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";

const NewChatModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const {
    searchUsers,
    clearUserSearch,
    userSearchResults,
    isUserSearchLoading,
    isStartingConversation,
    startDirectConversation,
  } = useChatStore();

  useEffect(() => () => clearUserSearch(), [clearUserSearch]);

  const handleQueryChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    void searchUsers(value);
  };

  const handleStart = async (participantId) => {
    try {
      await startDirectConversation(participantId);
      onClose();
    } catch {
      // The store displays the error and keeps the search open for retry.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-base-100 shadow-xl">
        <div className="flex items-center justify-between border-b border-base-300 p-4">
          <h2 className="text-lg font-semibold">New Chat</h2>
          <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4">
          <label className="input input-bordered flex items-center gap-2">
            <Search className="size-4 opacity-60" />
            <input
              autoFocus
              type="search"
              className="grow"
              placeholder="Search users"
              value={query}
              onChange={handleQueryChange}
            />
          </label>

          <div className="mt-3 max-h-72 overflow-y-auto">
            {isUserSearchLoading && (
              <div className="flex justify-center p-6">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!isUserSearchLoading && query.trim() && userSearchResults.length === 0 && (
              <p className="p-6 text-center text-sm text-base-content/60">No users found</p>
            )}
            {!isUserSearchLoading && !query.trim() && (
              <p className="p-6 text-center text-sm text-base-content/60">
                Search by name or email to start a conversation.
              </p>
            )}
            {!isUserSearchLoading &&
              userSearchResults.map((user) => (
                <button
                  type="button"
                  key={user._id}
                  disabled={isStartingConversation}
                  onClick={() => handleStart(user._id)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-base-200 disabled:opacity-60"
                >
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-11 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{user.fullName}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
