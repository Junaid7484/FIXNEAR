import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
} from "lucide-react";

import API from "../services/api";

function EditProfile() {
  const navigate = useNavigate();

  // =========================================
  // FORM DATA
  // =========================================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);

  // =========================================
  // GET CURRENT USER FROM BACKEND
  // =========================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);

        const response = await API.get("/auth/me");

        console.log("Edit Profile User:", response.data);

        const user = response.data.user;

        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
        });
        setProfileImage(user.profileImage || "");

        // Keep localStorage updated
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error("Fetch Profile Error:", error);

        setErrors({
          submit:
            error.response?.data?.message || "Unable to load your profile.",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  // =========================================
  // VALIDATE FORM
  // =========================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (
      !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, "").slice(-10))
    ) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Please select a valid image file.",
      }));

      return;
    }

    // Check size
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Image must be 5MB or smaller.",
      }));

      return;
    }

    console.log("Selected image:", file);
    console.log("Image name:", file.name);
    console.log("Image type:", file.type);
    console.log("Image size:", file.size);

    setProfileImageFile(file);

    // Preview
    setProfileImage(URL.createObjectURL(file));

    setErrors((prev) => ({
      ...prev,
      profileImage: "",
    }));
  };

  // =========================================
  // UPDATE PROFILE
  // =========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before sending request
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("phone", formData.phone);
      payload.append("address", formData.address);
      payload.append("city", formData.city);
      payload.append("state", formData.state);
      if (profileImageFile) payload.append("profileImage", profileImageFile);

      const response = await API.put("/users/profile", payload);

      console.log("Profile Update Response:", response.data);

      const updatedUser = response.data.user;

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess(true);

      // Redirect to profile
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error) {
      console.error("Profile Update Error:", error);

      setErrors({
        submit: error.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // LOADING PROFILE
  // =========================================
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="text-slate-600 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================================
          HEADER
      ========================================= */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back to Profile
          </Link>

          <div className="mt-6">
            <p className="text-blue-400 text-sm font-semibold">ACCOUNT</p>

            <h1 className="text-3xl font-bold mt-2">Edit Profile</h1>

            <p className="text-slate-400 mt-2">
              Update your personal information.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          MAIN
      ========================================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ERROR MESSAGE */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-4">
            <p className="font-semibold">Update Failed</p>

            <p className="text-sm mt-1">{errors.submit}</p>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-4">
            <CheckCircle2 size={20} />

            <div>
              <p className="font-semibold">Profile updated successfully.</p>

              <p className="text-sm mt-0.5">Redirecting to your profile...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* =====================================
              PROFILE PHOTO
          ===================================== */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900">Profile Photo</h2>

            <p className="text-sm text-slate-500 mt-1">
              Add a profile photo to personalize your account.
            </p>

            <div className="flex items-center gap-5 mt-6">
              {/* Profile Image Preview */}
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={42} className="text-blue-600" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="profileImage"
                  className="flex items-center gap-2 border border-slate-200 hover:border-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer"
                >
                  <Camera size={17} />
                  Change Photo
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-slate-400">
                  JPG, PNG or WEBP • Max 5MB
                </p>
              </div>
            </div>
          </section>

          {/* =====================================
              PERSONAL INFORMATION
          ===================================== */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={20} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Personal Information
                </h2>

                <p className="text-sm text-slate-500">
                  Update your basic account details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
              {/* NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition ${
                      errors.name
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition ${
                      errors.email
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition ${
                      errors.phone
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              ADDRESS
          ===================================== */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <MapPin size={20} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Address Information
                </h2>

                <p className="text-sm text-slate-500">
                  This information can be used for your service bookings.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
              {/* ADDRESS */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-4 text-slate-400"
                  />

                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter your full address"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none resize-none transition ${
                      errors.address
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errors.address && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* CITY */}
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                    errors.city
                      ? "border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {errors.city && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.city}</p>
                )}
              </div>

              {/* STATE */}
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  State
                </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                    errors.state
                      ? "border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {errors.state && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.state}</p>
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              BUTTONS
          ===================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Link
                to="/profile"
                className="flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold transition"
              >
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditProfile;
