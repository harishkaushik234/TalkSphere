import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { clearUnreadCount } from "../hooks/useUnreadMessages";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasConnectedRef = useRef(false);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    let isMounted = true;
    let clientInstance = null;

    const initChat = async () => {
      if (!tokenData?.token || !authUser || !targetUserId) {
        setLoading(false);
        return;
      }

      // Get or create client instance
      clientInstance = StreamChat.getInstance(STREAM_API_KEY);

      // Check if already connected with same user
      const isAlreadyConnected = clientInstance.userID === authUser._id && clientInstance.user;

      if (isAlreadyConnected) {
        // Already connected, just create channel
        hasConnectedRef.current = true;
        try {
          const channelId = [authUser._id, targetUserId].sort().join("-");
          const currChannel = clientInstance.channel("messaging", channelId, {
            members: [authUser._id, targetUserId],
          });
          await currChannel.watch();

          // Clear unread count when user views this chat
          if (channelId) {
            clearUnreadCount(channelId);
          }

          // Mark channel as read
          await currChannel.markRead();

          currChannel.on("message.new", (event) => {
            if (event.user?.id !== authUser._id && isMounted) {
              toast.success("New message received");
            }
          });

          if (isMounted) {
            setChatClient(clientInstance);
            setChannel(currChannel);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error creating channel:", error);
          if (isMounted) {
            toast.error("Could not create chat channel. Please try again.");
            setLoading(false);
          }
        }
        return;
      }

      // First time connection - prevent multiple calls
      if (hasConnectedRef.current) {
        setLoading(false);
        return;
      }

      try {
        console.log("Initializing stream chat client...");
        hasConnectedRef.current = true;

        // Only send image if it's not a base64 data URL (too large for WebSocket)
        // Use a URL or empty string instead
        let imageUrl = authUser.profilePic || "";
        if (imageUrl.startsWith("data:image")) {
          // Base64 images are too large for Stream WebSocket, use empty or convert to URL
          // For now, use empty - user can upload to a CDN later if needed
          imageUrl = "";
        }

        await clientInstance.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: imageUrl,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = clientInstance.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        // Clear unread count when user views this chat
        const resolvedChannelId = currChannel.id || currChannel.cid;
        if (resolvedChannelId) {
          clearUnreadCount(resolvedChannelId);
        }

        // Mark channel as read
        await currChannel.markRead();

        // Toast when a new message arrives in this chat
        currChannel.on("message.new", (event) => {
          if (event.user?.id !== authUser._id && isMounted) {
            toast.success("New message received");
          }
        });

        if (isMounted) {
          setChatClient(clientInstance);
        setChannel(currChannel);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        if (isMounted) {
          // Check if it's a WebSocket/network error
          const errorMessage = error.message || "";
          if (errorMessage.includes("WS") || errorMessage.includes("WebSocket") || error.isWSFailure) {
            toast.error("Network connection issue. Please check your internet and try refreshing the page.");
          } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
            toast.error("Authentication failed. Please log in again.");
          } else {
        toast.error("Could not connect to chat. Please try again.");
          }
          // Reset connection flag on error so user can retry
          hasConnectedRef.current = false;
        }
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    initChat();

    // Cleanup on unmount or dependency change
    return () => {
      isMounted = false;
      // Don't disconnect client here - let it persist across route changes
      // Only cleanup channel listeners if needed
    };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
