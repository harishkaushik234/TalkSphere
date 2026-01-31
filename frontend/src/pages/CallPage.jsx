import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();

  const { authUser, isLoading } = useAuthUser();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  useEffect(() => {
    const joinCall = async () => {
      if (!authUser || !tokenData?.token || !callId) {
        setConnecting(false);
        return;
      }

      try {
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: "", // 🔥 MUST BE EMPTY (NO BASE64)
          },
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);

        // ✅ create or join safely
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (err) {
        console.error("Call join error:", err);
        toast.error("Could not start call");
        navigate("/");
      } finally {
        setConnecting(false);
      }
    };

    joinCall();
  }, [authUser, tokenData, callId, navigate]);

  if (isLoading || connecting) return <PageLoader />;

  if (!client || !call) {
    return <p className="text-center">Could not start call</p>;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallContent />
      </StreamCall>
    </StreamVideo>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;
