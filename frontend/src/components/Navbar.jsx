import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, UsersIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { getSafeAvatarUrl } from "../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";
// unread badge removed from current user profile; per-friend badges shown on FriendCard

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests-navbar"],
    queryFn: getFriendRequests,
    enabled: !!authUser,
    refetchInterval: 10000,
  });

  const incomingCount = friendRequests?.incomingReqs?.length || 0;

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Streamify
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to="/friends">
              <button className="btn btn-ghost btn-circle">
                <UsersIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>

            <Link to={"/notifications"}>
              <div className="indicator">
                {incomingCount > 0 && (
                  <span className="indicator-item badge badge-error badge-xs" />
                )}
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
              </div>
            </Link>
          </div>

          {/* TODO */}
          <ThemeSelector />

          <Link to="/profile" className="relative">
            <div className="avatar">
              <div className="w-9 rounded-full">
                <img
                  src={getSafeAvatarUrl(authUser?.profilePic, authUser?.fullName)}
                  alt="User Avatar"
                  rel="noreferrer"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
              </div>
            </div>
            {/* Unread badge removed from current user's avatar (notifications shown on sender's profile) */}
          </Link>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
