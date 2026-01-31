import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
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
    enabled: !!authUser,
  });

  useEffect(() => {
    let isMounted = true;
    let client;

    const initChat = async () => {
      if (!authUser || !tokenData?.token || !targetUserId) {
        setLoading(false);
        return;
      }

      client = StreamChat.getInstance(STREAM_API_KEY);

      try {
        if (!client.userID && !hasConnectedRef.current) {
          hasConnectedRef.current = true;

          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: "", // 🔥 MUST BE EMPTY
            },
            tokenData.token
          );
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        await currChannel.markRead();
        clearUnreadCount(channelId);

        if (isMounted) {
          setChatClient(client);
          setChannel(currChannel);
        }
      } catch (err) {
        console.error("Chat error:", err);
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
  }, [authUser, tokenData, targetUserId]);

  // 🔥 VIDEO CALL LINK (SAFE)
  const handleVideoCall = async () => {
    try {
      if (!channel) return;

      // ✅ remove "messaging:" if present
      const rawId = channel.id;
      const callId = rawId.includes(":") ? rawId.split(":")[1] : rawId;

      const callUrl = `${window.location.origin}/call/${callId}`;

      await channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent");
    } catch (err) {
      console.error("Video call link error:", err);
      toast.error("Could not start video call");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  // return (
  //   <div className="h-[93vh]">
  //     <Chat client={chatClient}>
  //       <Channel channel={channel}>
  //         <div className="w-full relative">
  //           <CallButton handleVideoCall={handleVideoCall} />
  //           <Window>
  //             <ChannelHeader />
  //             <MessageList />
  //             <MessageInput focus />
  //           </Window>
  //         </div>
  //         <Thread />
  //       </Channel>
  //     </Chat>
  //   </div>
  // );



  return (
  <div className="full-height w-full flex flex-col overflow-hidden">

    <Chat client={chatClient}>
      <Channel channel={channel}>
        <div className="flex flex-col flex-1 overflow-hidden relative w-full">

          <CallButton handleVideoCall={handleVideoCall} />

          <Window>
            <ChannelHeader />

            {/* Message list should scroll */}
            <div className="flex-1 overflow-y-auto">
              <MessageList />
            </div>

            {/* Input always at bottom */}
            <div className="sticky bottom-0 bg-base-100 w-full px-2">

              <MessageInput focus />
            </div>
          </Window>
        </div>

        <Thread />
      </Channel>
    </Chat>
  </div>
);

};

export default ChatPage;
