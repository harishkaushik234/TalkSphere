import { Link } from "react-router";
import { getLanguageFlag } from "../lib/getLanguageFlag";
import { getSafeAvatarUrl } from "../lib/utils";
import useAuthUser from "../hooks/useAuthUser";
import { useUnreadForChannel } from "../hooks/useUnreadMessages";

const FriendCard = ({ friend }) => {
  const { authUser } = useAuthUser();
  const channelId = [authUser?._id, friend._id].sort().join("-");
  const unread = useUnreadForChannel(channelId);
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3 relative">
          <div className="avatar size-12">
            <img
              src={getSafeAvatarUrl(friend.profilePic, friend.fullName)}
              alt={friend.fullName}
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
          {unread > 0 && (
            <div className="absolute left-10 top-0 badge badge-error badge-sm">
              {unread > 99 ? "99+" : unread}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          Message
        </Link>
      </div>
    </div>
  );
};
export default FriendCard;
