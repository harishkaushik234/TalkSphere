import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriends, removeFriend } from "../lib/api";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { useState } from "react";

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState(null);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { mutate: removeFriendMutation } = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const handleUnfriend = (friendId) => {
    setRemovingId(friendId);
    removeFriendMutation(friendId, {
      onSettled: () => setRemovingId(null),
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your Friends
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <div key={friend._id} className="space-y-2">
                <FriendCard friend={friend} />
                <button
                  className="btn btn-error btn-outline btn-sm w-full"
                  onClick={() => handleUnfriend(friend._id)}
                  disabled={removingId === friend._id}
                >
                  {removingId === friend._id ? "Removing..." : "Unfriend"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
