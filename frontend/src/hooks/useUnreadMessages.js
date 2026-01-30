import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";
import { StreamChat } from "stream-chat";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Global unread count state
let unreadCounts = {}; // { channelId: count }
let unreadListeners = new Set();
// Reusable Stream client for unread tracking
let globalClientForUnread = null;

// Notify all listeners of unread count changes
const notifyListeners = () => {
  unreadListeners.forEach((listener) => listener());
};

// Update unread count for a channel
export const updateUnreadCount = (channelId, count) => {
  unreadCounts[channelId] = count;
  notifyListeners();
};

// Clear unread count for a channel
export const clearUnreadCount = (channelId) => {
  delete unreadCounts[channelId];
  notifyListeners();
};

// Get total unread count
export const getTotalUnreadCount = () => {
  return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
};

// Get unread count for a specific channel
export const getUnreadCount = (channelId) => {
  return unreadCounts[channelId] || 0;
};

// Hook to subscribe to unread count for a specific channel
export const useUnreadForChannel = (channelId) => {
  const [count, setCount] = useState(getUnreadCount(channelId));

  useEffect(() => {
    const listener = () => {
      setCount(getUnreadCount(channelId));
    };

    unreadListeners.add(listener);
    // initialize
    setCount(getUnreadCount(channelId));

    return () => unreadListeners.delete(listener);
  }, [channelId]);

  return count;
};

export const useUnreadMessages = () => {
  const { authUser } = useAuthUser();
  const [totalUnread, setTotalUnread] = useState(0);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    refetchInterval: false,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    const initUnreadTracking = async () => {
      try {
        // Get or create global client (reuse from useMessageNotifications if available)
        if (!globalClientForUnread) {
          globalClientForUnread = StreamChat.getInstance(STREAM_API_KEY);
        }

        // Check if already connected
        if (globalClientForUnread.userID === authUser._id && globalClientForUnread.user) {
          // Already connected, just set up listeners
        } else {
          // Filter base64 images
          let imageUrl = authUser.profilePic || "";
          if (imageUrl.startsWith("data:image")) {
            imageUrl = "";
          }

          await globalClientForUnread.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: imageUrl,
            },
            tokenData.token
          );
        }

        // Listen for unread counts and refetch channel state for real-time updates
        globalClientForUnread.on((event) => {
          if (event.type === "notification.message_new" || event.type === "message.new") {
            const message = event.message;
            if (message && message.user?.id !== authUser._id) {
              const channelId = message.cid || message.channel_id;
              if (channelId) {
                // Refetch the channel to get the updated unread count from server
                (async () => {
                  try {
                    const channel = globalClientForUnread.channel("messaging", channelId);
                    await channel.query();
                    const unread = channel.state?.unreadCount || 0;
                    if (unread > 0) {
                      updateUnreadCount(channelId, unread);
                    } else {
                      clearUnreadCount(channelId);
                    }
                  } catch (err) {
                    // Fallback: just increment if refetch fails
                    const currentCount = unreadCounts[channelId] || 0;
                    updateUnreadCount(channelId, currentCount + 1);
                  }
                })();
              }
            }
          }
        });

        // Listen for channel updates (includes unread count changes from server)
        globalClientForUnread.on("channel.updated", (event) => {
          if (event.channel) {
            const channelId = event.channel.id || event.channel.cid;
            const unread = event.channel.state?.unreadCount || 0;
            if (unread > 0) {
              updateUnreadCount(channelId, unread);
            } else {
              clearUnreadCount(channelId);
            }
          }
        });

        // Query all channels to get initial unread counts
        const filter = {
          type: "messaging",
          members: { $in: [authUser._id] },
        };

        const channels = await globalClientForUnread.queryChannels(filter, {}, {});
        
        // Initialize unread counts from channels
        channels.forEach((channel) => {
          const unread = channel.state?.unreadCount || 0;
          if (unread > 0) {
            const channelId = channel.id || channel.cid;
            updateUnreadCount(channelId, unread);
          }
        });
      } catch (error) {
        console.error("Error initializing unread tracking:", error);
      }
    };

    initUnreadTracking();

    // Listener for unread count updates
    const listener = () => {
      setTotalUnread(getTotalUnreadCount());
    };

    unreadListeners.add(listener);
    setTotalUnread(getTotalUnreadCount());

    return () => {
      unreadListeners.delete(listener);
    };
  }, [tokenData, authUser]);

  return totalUnread;
};
