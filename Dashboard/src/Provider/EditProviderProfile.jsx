import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

import API from "../services/api";

function EditProviderProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: "",
    name: "",
    email: "",
    phone: "",
    description: "",
    experience: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profileImage: "",
    isAvailable: true,
  });

  const [workingHours, setWorkingHours] = useState({
    monday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    tuesday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    wednesday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    thursday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    friday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    saturday: {
      enabled: true,
      start: "09:00",
      end: "19:00",
    },
    sunday: {
      enabled: false,
      start: "09:00",
      end: "19:00",
    },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  /*
   * ---------------------------------------------------------
   * LOAD PROVIDER PROFILE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  const fetchProviderProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await API.get("/providers/my/profile");

      const provider = response.data?.provider;

      if (!provider) {
        throw new Error("Provider profile not found.");
      }

      setFormData({
        businessName: provider.businessName || "",
        name: provider.user?.name || provider.name || "",
        email: provider.user?.email || provider.email || "",
        phone: provider.phone || provider.user?.phone || "",
        description: provider.description || "",
        experience:
          provider.experience !== undefined && provider.experience !== null
            ? String(provider.experience)
            : "",
        address: provider.address || "",
        city: provider.city || "",
        state: provider.state || "",
        pincode: provider.pincode || "",
        profileImage: provider.profileImage || "",
        isAvailable:
          provider.isAvailable !== undefined ? provider.isAvailable : true,
      });

      if (provider.workingHours) {
        setWorkingHours((prev) => ({
          ...prev,

          monday: {
            ...prev.monday,
            ...(provider.workingHours.monday || {}),
          },

          tuesday: {
            ...prev.tuesday,
            ...(provider.workingHours.tuesday || {}),
          },

          wednesday: {
            ...prev.wednesday,
            ...(provider.workingHours.wednesday || {}),
          },

          thursday: {
            ...prev.thursday,
            ...(provider.workingHours.thursday || {}),
          },

          friday: {
            ...prev.friday,
            ...(provider.workingHours.friday || {}),
          },

          saturday: {
            ...prev.saturday,
            ...(provider.workingHours.saturday || {}),
          },

          sunday: {
            ...prev.sunday,
            ...(provider.workingHours.sunday || {}),
          },
        }));
      }
    } catch (error) {
      console.error("Load provider profile error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/provider/login");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to load provider profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * FORM CHANGE
   * ---------------------------------------------------------
   */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setErrorMessage("");
  };

  /*
   * ---------------------------------------------------------
   * WORKING HOURS CHANGE
   * ---------------------------------------------------------
   */

  const handleWorkingHoursChange = (day, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    setErrorMessage("");
  };

  /*
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    } else if (formData.businessName.trim().length < 3) {
      newErrors.businessName = "Business name must be at least 3 characters";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Provider name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (
      formData.experience === "" ||
      formData.experience === null ||
      formData.experience === undefined
    ) {
      newErrors.experience = "Experience is required";
    } else if (Number(formData.experience) < 0) {
      newErrors.experience = "Experience cannot be negative";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    /*
     * Validate working hours
     */

    days.forEach(({ key, label }) => {
      const day = workingHours[key];

      if (!day) return;

      if (day.enabled) {
        if (!day.start) {
          newErrors[`workingHours_${key}_start`] =
            `${label} start time is required`;
        }

        if (!day.end) {
          newErrors[`workingHours_${key}_end`] =
            `${label} end time is required`;
        }

        if (day.start && day.end && day.start >= day.end) {
          newErrors[`workingHours_${key}_time`] =
            `${label} end time must be after start time`;
        }
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * ---------------------------------------------------------
   * SAVE PROFILE
   * ---------------------------------------------------------
   */

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrorMessage("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setErrorMessage("Image must be 5MB or smaller."); return; }
    setProfileImageFile(file);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess(false);
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Update provider profile
       */

      const profilePayload = new FormData();
      const profileFields = {
        businessName: formData.businessName.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        description: formData.description.trim(),
        experience: Number(formData.experience),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        isAvailable: String(formData.isAvailable),
      };
      Object.entries(profileFields).forEach(([key, value]) => profilePayload.append(key, value ?? ""));
      if (profileImageFile) profilePayload.append("profileImage", profileImageFile);

      const profileResponse = await API.put(
        "/providers/my/profile",
        profilePayload,
      );

      /*
       * Update working hours
       */

      await API.put("/providers/my/working-hours", {
        workingHours,
      });

      /*
       * Update localStorage user information
       * so the provider navbar/dashboard can immediately
       * show the updated name.
       */

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          const updatedProvider = profileResponse.data?.provider;

          const updatedUser = {
            ...user,
            name:
              updatedProvider?.user?.name ||
              updatedProvider?.name ||
              formData.name.trim(),
            phone: updatedProvider?.phone || formData.phone.trim(),
            address: updatedProvider?.address || formData.address.trim(),
            city: updatedProvider?.city || formData.city.trim(),
            state: updatedProvider?.state || formData.state.trim(),
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (storageError) {
          console.error("Update local user error:", storageError);
        }
      }

      setSuccess(true);

      /*
       * Redirect after successful save
       */

      setTimeout(() => {
        navigate("/provider/profile");
      }, 1000);
    } catch (error) {
      console.error("Update provider profile error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/provider/login");
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update provider profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOADING SCREEN
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading provider profile...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}

      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/provider/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={17} />
            Back to Provider Profile
          </Link>

          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Edit Provider Profile
            </h1>

            <p className="text-slate-400 mt-2">
              Update your business information and service details.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-semibold text-red-800">
              Unable to update profile
            </p>

            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Success */}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="text-green-600 shrink-0" size={22} />

            <div>
              <p className="font-semibold text-green-800">
                Profile updated successfully!
              </p>

              <p className="text-sm text-green-700 mt-1">
                Redirecting to your provider profile...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900">Profile Photo</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center overflow-hidden">
                  {formData.profileImage ? (
                    <img
                      src={profileImageFile ? URL.createObjectURL(profileImageFile) : formData.profileImage}
                      alt="Provider"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={42} className="text-blue-600" />
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center border-4 border-white hover:bg-blue-700 transition-colors cursor-pointer">
                  <Camera size={16} />
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleProfileImageChange} className="hidden" />
                </label>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Add a professional profile photo
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  A clear photo helps customers recognize your business.
                </p>

                <label className="mt-3 inline-flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer">
                  <ImagePlus size={16} />
                  Upload Photo
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleProfileImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </section>

          {/* Basic Information */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Basic Information
                </h2>

                <p className="text-sm text-slate-500">
                  Your personal and business details
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mt-6">
              {/* Business Name */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Business Name
                </label>

                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.businessName ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.businessName && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.businessName}
                  </p>
                )}
              </div>

              {/* Provider Name */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Provider Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>
                )}
              </div>

              {/* Email */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />

                <p className="text-xs text-slate-400 mt-1.5">
                  Email is managed through your account.
                </p>
              </div>

              {/* Phone */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                      errors.phone ? "border-red-400" : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.phone}</p>
                )}
              </div>

              {/* Experience */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Experience (Years)
                </label>

                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  placeholder="8"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.experience ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.experience && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.experience}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Service Information */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Service Information
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Tell customers about your services
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                About Your Business
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                maxLength={1000}
                placeholder="Describe your services and experience..."
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.description ? "border-red-400" : "border-slate-200"
                } resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />

              <div className="flex items-center justify-between mt-1.5">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}

                <span className="text-xs text-slate-400">
                  {formData.description.length}/1000
                </span>
              </div>
            </div>
          </section>

          {/* Location */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Service Location
                </h2>

                <p className="text-sm text-slate-500">
                  Where you provide your services
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Address
              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter your complete address"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.address ? "border-red-400" : "border-slate-200"
                } resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />

              {errors.address && (
                <p className="text-xs text-red-500 mt-1.5">{errors.address}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {/* City */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Bhagalpur"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.city ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.city && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.city}</p>
                )}
              </div>

              {/* State */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Bihar"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.state ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.state && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.state}</p>
                )}
              </div>

              {/* Pincode */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pincode
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="812001"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.pincode ? "border-red-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {errors.pincode && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Working Hours */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Clock size={20} className="text-purple-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Working Hours
                </h2>

                <p className="text-sm text-slate-500">
                  Set your service availability for each day
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {days.map(({ key, label }) => {
                const day = workingHours[key];

                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
                      {/* Day + Toggle */}

                      <label className="flex items-center gap-3 min-w-[150px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={(e) =>
                            handleWorkingHoursChange(
                              key,
                              "enabled",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 accent-blue-600"
                        />

                        <span className="font-semibold text-slate-900">
                          {label}
                        </span>
                      </label>

                      {/* Times */}

                      {day.enabled ? (
                        <div className="grid sm:grid-cols-2 gap-3 w-full lg:max-w-md">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Start Time
                            </label>

                            <input
                              type="time"
                              value={day.start}
                              onChange={(e) =>
                                handleWorkingHoursChange(
                                  key,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              End Time
                            </label>

                            <input
                              type="time"
                              value={day.end}
                              onChange={(e) =>
                                handleWorkingHoursChange(
                                  key,
                                  "end",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Closed</div>
                      )}
                    </div>

                    {errors[`workingHours_${key}_time`] && (
                      <p className="text-xs text-red-500 mt-2">
                        {errors[`workingHours_${key}_time`]}
                      </p>
                    )}

                    {errors[`workingHours_${key}_start`] && (
                      <p className="text-xs text-red-500 mt-2">
                        {errors[`workingHours_${key}_start`]}
                      </p>
                    )}

                    {errors[`workingHours_${key}_end`] && (
                      <p className="text-xs text-red-500 mt-2">
                        {errors[`workingHours_${key}_end`]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Availability */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Booking Availability
                </h2>

                <p className="text-sm text-slate-500">
                  Control whether customers can book your services.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900">
                    Available for New Bookings
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Customers can book your services when this is enabled.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="sr-only peer"
                />

                <div className="relative w-12 h-7 bg-slate-300 rounded-full peer-checked:bg-green-500 transition-colors">
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </section>

          {/* Bottom Actions */}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
            <Link
              to="/provider/profile"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || success}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold transition-colors"
            >
              {saving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        </form>
      </main>
    </div>
  );
}

export default EditProviderProfile;
