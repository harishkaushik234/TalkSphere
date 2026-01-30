export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Filter out broken avatar URLs (avatar.iran.liara.run domain is down)
export function getSafeAvatarUrl(profilePic, fullName = "User") {
  if (!profilePic || profilePic.includes("avatar.iran.liara.run")) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  }
  return profilePic;
}
