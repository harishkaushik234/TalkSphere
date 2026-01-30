import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfile } from "../lib/api";
import toast from "react-hot-toast";
import {
  LoaderIcon,
  MapPinIcon,
  ShuffleIcon,
  CameraIcon,
  ImageIcon,
} from "lucide-react";
import { LANGUAGES } from "../constants";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Profile update failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation(formState);
  };

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setFormState((prev) => ({ ...prev, profilePic: avatar }));
    toast.success("Random avatar generated!");
  };

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large! Please select an image smaller than 5MB.");
      return;
    }

    try {
      toast.loading("Compressing image...");
      const compressedBase64 = await compressImage(file);
      setFormState((prev) => ({
        ...prev,
        profilePic: compressedBase64,
      }));
      toast.dismiss();
      toast.success("Profile picture selected");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to process image. Please try again.");
      console.error("Image compression error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 card bg-base-200 p-6 sm:p-8">
          {/* PROFILE PIC */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="size-32 rounded-full bg-base-300 overflow-hidden">
              {formState.profilePic ? (
                <img
                  src={formState.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CameraIcon className="size-12 opacity-40" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="btn btn-accent btn-sm"
              >
                <ShuffleIcon className="size-4 mr-2" />
                Random Avatar
              </button>

              <label className="btn btn-outline btn-sm cursor-pointer">
                <ImageIcon className="size-4 mr-2" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* FULL NAME */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              value={formState.fullName}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="input input-bordered w-full"
              placeholder="Your full name"
            />
          </div>

          {/* BIO */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Bio</span>
            </label>
            <textarea
              value={formState.bio}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="textarea textarea-bordered h-24"
              placeholder="Tell others about yourself"
            />
          </div>

          {/* LANGUAGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Native Language</span>
              </label>
              <select
                value={formState.nativeLanguage}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    nativeLanguage: e.target.value,
                  }))
                }
                className="select select-bordered w-full"
              >
                <option value="">Select your native language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Learning Language</span>
              </label>
              <select
                value={formState.learningLanguage}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    learningLanguage: e.target.value,
                  }))
                }
                className="select select-bordered w-full"
              >
                <option value="">Select language you're learning</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LOCATION */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Location</span>
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-70" />
              <input
                type="text"
                value={formState.location}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, location: e.target.value }))
                }
                className="input input-bordered w-full pl-10"
                placeholder="City, Country"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isPending}
          >
            {!isPending ? (
              "Save Changes"
            ) : (
              <>
                <LoaderIcon className="animate-spin size-5 mr-2" />
                Saving...
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

