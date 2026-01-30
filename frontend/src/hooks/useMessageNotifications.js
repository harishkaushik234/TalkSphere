import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Global Stream client instance
let globalChatClient = null;
let isGlobalClientConnected = false;
let messageListenerSetup = false;

// Setup message listeners (only once)
const setupMessageListeners = () => {
  if (messageListenerSetup || !globalChatClient) return;
  
  globalChatClient.on((event) => {
    // Listen for new message notifications
    if (event.type === "notification.message_new") {
      const message = event.message;
      if (message && message.user?.id !== globalChatClient.userID) {
        const senderName = message.user?.name || "Someone";
        toast.success(`New message from ${senderName}`, {
          icon: "💬",
          duration: 4000,
        });
      }
    }
    
    // Also listen for direct message.new events
    if (event.type === "message.new" && event.message) {
      if (event.message.user?.id !== globalChatClient.userID) {
        const senderName = event.message.user?.name || "Someone";
        toast.success(`New message from ${senderName}`, {
          icon: "💬",
          duration: 4000,
        });
      }
    }
  });
  
  messageListenerSetup = true;
};

export const useMessageNotifications = () => {
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    refetchInterval: false,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    const initGlobalClient = async () => {
      try {
        // Get or create global client (singleton)
        if (!globalChatClient) {
          globalChatClient = StreamChat.getInstance(STREAM_API_KEY);
        }

        // Check if already connected with same user
        if (globalChatClient.userID === authUser._id && globalChatClient.user) {
          // Already connected, just set up listeners if not already done
          if (!isGlobalClientConnected) {
            setupMessageListeners();
            isGlobalClientConnected = true;
          }
          return;
        }

        // If connected with different user, disconnect first
        if (globalChatClient.userID && globalChatClient.userID !== authUser._id) {
          try {
            await globalChatClient.disconnectUser();
            isGlobalClientConnected = false;
            messageListenerSetup = false; // Reset listener flag
          } catch (disconnectError) {
            console.log("Error disconnecting previous user:", disconnectError);
          }
        }

        // Filter base64 images
        let imageUrl = authUser.profilePic || "";
        if (imageUrl.startsWith("data:image")) {
          imageUrl = "";
        }

        // Connect user
        await globalChatClient.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: imageUrl,
          },
          tokenData.token
        );

        isGlobalClientConnected = true;
        setupMessageListeners();

        console.log("Global message notifications enabled");
      } catch (error) {
        console.error("Error initializing global message notifications:", error);
        // If error is about duplicate connection, it's likely already connected
        if (error.message?.includes("connectUser was called twice")) {
          console.log("Client already connected, setting up listeners");
          if (globalChatClient.userID === authUser._id) {
            setupMessageListeners();
            isGlobalClientConnected = true;
          }
        }
      }
    };

    initGlobalClient();

    // Cleanup on unmount
    return () => {
      // Don't disconnect - keep connection alive for notifications
    };
  }, [tokenData, authUser]);

  return null; // This hook doesn't return anything, just sets up listeners
};
