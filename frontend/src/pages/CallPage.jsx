import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
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
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Suppress harmless Stream Video SDK warnings (ICE Candidate 701, Participant not found)
  // These are internal SDK warnings that don't affect functionality
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalWarn = console.warn;
    const originalError = console.error;

    const filteredWarn = (...args) => {
      // Build a searchable string from all console arguments (handles Error objects and non-strings)
      const fullMessage = args
        .map((a) => {
          try {
            if (a && typeof a === "object") return a.message || JSON.stringify(a);
            return String(a);
          } catch (e) {
            return String(a);
          }
        })
        .join(" ");

      // Only suppress specific harmless Stream SDK warnings
      if (
        fullMessage.includes("ICE Candidate error 701") ||
        fullMessage.includes("Participant with sessionId not found") ||
        (fullMessage.includes("[Publisher") && fullMessage.includes("ICE Candidate error 701")) ||
        (fullMessage.includes("[CallState]") && fullMessage.includes("Participant with sessionId"))
      ) {
        return; // Suppress these harmless warnings
      }
      originalWarn(...args);
    };

    const filteredError = (...args) => {
      const fullMessage = args
        .map((a) => {
          try {
            if (a && typeof a === "object") return a.message || JSON.stringify(a);
            return String(a);
          } catch (e) {
            return String(a);
          }
        })
        .join(" ");

      // Only suppress specific harmless Stream SDK warnings
      if (
        fullMessage.includes("ICE Candidate error 701") ||
        fullMessage.includes("Participant with sessionId not found") ||
        (fullMessage.includes("[Publisher") && fullMessage.includes("ICE Candidate error 701")) ||
        (fullMessage.includes("[CallState]") && fullMessage.includes("Participant with sessionId"))
      ) {
        return; // Suppress these harmless warnings
      }
      originalError(...args);
    };

    console.warn = filteredWarn;
    console.error = filteredError;

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) {
        if (isMounted) {
          setIsConnecting(false);
        }
        return;
      }

      try {
        console.log("Initializing Stream video client...");

        // Filter out base64 images (Stream Video SDK has 5KB limit for user custom data)
        let imageUrl = authUser.profilePic || "";
        if (imageUrl.startsWith("data:image")) {
          // Base64 images are too large for Stream Video SDK, use empty string
          imageUrl = "";
        }

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: imageUrl, // Use filtered image URL
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        console.log("Joined call successfully");

        if (isMounted) {
          setClient(videoClient);
          setCall(callInstance);
        }
      } catch (error) {
        console.error("Error joining call:", error);
        const errorMessage = error.message || "";

        if (isMounted) {
          // Check for specific Stream errors
          if (errorMessage.includes("user custom data cannot be bigger than 5KB") || error.code === 22) {
            toast.error("Profile picture is too large. Please update your profile with a smaller image.");
          } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
            toast.error("Authentication failed. Please log in again.");
          } else {
            toast.error("Could not join the call. Please try again.");
          }
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
    };
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  // Use useEffect to handle navigation (don't call navigate during render)
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  // Don't render if call is left
  if (callingState === CallingState.LEFT) {
    return null;
  }

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;
