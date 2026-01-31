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

  // 🔑 Stream token
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  /* =========================
     INIT STREAM CHAT
  ========================= */
  useEffect(() => {
    let isMounted = true;
    let clientInstance = null;

    const initChat = async () => {
      if (!tokenData?.token || !authUser || !targetUserId) {
        setLoading(false);
        return;
      }

      clientInstance = StreamChat.getInstance(STREAM_API_KEY);

      const isAlreadyConnected =
        clientInstance.userID === authUser._id && clientInstance.user;

      try {
        if (!isAlreadyConnected && !hasConnectedRef.current) {
          hasConnectedRef.current = true;

          // 🔥 BASE64 IMAGE FIX (VERY IMPORTANT)
          let imageUrl = authUser.profilePic || "";
          if (imageUrl.startsWith("data:image")) {
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
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = clientInstance.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        await currChannel.markRead();
        clearUnreadCount(channelId);

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
        console.error("Chat init error:", error);
        toast.error("Could not connect to chat");
        hasConnectedRef.current = false;
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
  }, [tokenData, authUser, targetUserId]);

  /* =========================
     VIDEO CALL (FIXED 🔥)
  ========================= */
  const handleVideoCall = async () => {
    try {
      if (!authUser || !channel || !tokenData?.token) {
        toast.error("User or Stream token not ready");
        return;
      }

      const callId = channel.id;

      const { StreamVideoClient } = await import(
        "@stream-io/video-react-sdk"
      );

      // 🔥 BASE64 IMAGE FIX AGAIN (VERY IMPORTANT)
      let imageUrl = authUser.profilePic || "";
      if (imageUrl.startsWith("data:image")) {
        imageUrl = "";
      }

      const videoClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: {
          id: authUser._id,
          name: authUser.fullName,
          image: imageUrl,
        },
        token: tokenData.token,
      });

      // 🔥 CREATE CALL BEFORE SHARING LINK
      const call = videoClient.call("default", callId);
      await call.getOrCreate();

      const callUrl = `${window.location.origin}/call/${callId}`;

      await channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call started!");
    } catch (error) {
      console.error("Video call error:", error);
      toast.error("Could not start video call");
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
