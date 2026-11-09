import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  IndianRupee,
  Clock,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  ChevronRight,
  Layers3,
  CircleDollarSign,
  Globe2,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";
import API from "../services/api";

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    image: "",
    status: "Active",
  });

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // =====================================================
  // FORM OPTIONS
  // =====================================================

  const categories = [
    "Cleaning",
    "Plumbing",
    "Electrical",
    "AC & Appliance",
    "Carpentry",
    "Painting",
    "Pest Control",
    "Beauty & Wellness",
    "Home Repair",
    "Moving & Shifting",
    "Other",
  ];

  const durations = [
    "15 minutes",
    "30 minutes",
    "45 minutes",
    "1 hour",
    "1.5 hours",
    "2 hours",
    "3 hours",
    "4 hours",
    "Half Day",
    "Full Day",
  ];

  // =====================================================
  // CLEAR ADMIN SESSION
  // =====================================================

  const clearAdminSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
  };

  // =====================================================
  // LOAD SERVICE FOR EDIT
  // =====================================================

  useEffect(() => {
    if (!isEditMode) {
      setLoadingInitial(false);
      return;
    }

    const loadService = async () => {
      try {
        setLoadingInitial(true);
        setError("");

        const response = await API.get("/services/admin/all");

        const services = response?.data?.services || [];

        const service = services.find(
          (item) => String(item?._id) === String(id),
        );

        if (!service) {
          setError("Service not found.");
          return;
        }

        setFormData({
          name: service?.name || "",
          category: service?.category || "",
          description: service?.description || "",
          price: service?.price ?? "",
          duration: service?.duration || "",
          image: service?.image || "",
          status: service?.isActive === false ? "Inactive" : "Active",
        });
      } catch (err) {
        console.error("Load Service Error:", err);

        if (err?.response?.status === 401) {
          clearAdminSession();

          navigate("/admin/login", {
            replace: true,
          });

          return;
        }

        if (err?.response?.status === 403) {
          setError("You are not authorized to manage services.");
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Failed to load service. Please try again.",
        );
      } finally {
        setLoadingInitial(false);
      }
    };

    loadService();
  }, [id, isEditMode, navigate]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSaved(false);
  };

  // =====================================================
  // STATUS CHANGE
  // =====================================================

  const handleStatusChange = (status) => {
    setFormData((previous) => ({
      ...previous,
      status,
    }));

    setError("");
    setSaved(false);
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter service name.";
    }

    if (!formData.category) {
      return "Please select a category.";
    }

    if (!formData.description.trim()) {
      return "Please enter service description.";
    }

    if (
      formData.price === "" ||
      Number(formData.price) <= 0 ||
      Number.isNaN(Number(formData.price))
    ) {
      return "Please enter a valid price greater than 0.";
    }

    if (!formData.duration) {
      return "Please select service duration.";
    }

    return "";
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");
      return;
    }
    setImageFile(file);
    setError("");
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSaved(false);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("category", formData.category);
      payload.append("price", String(Number(formData.price)));
      payload.append("duration", formData.duration);
      payload.append("isActive", String(formData.status === "Active"));
      if (imageFile) payload.append("image", imageFile);

      let response;

      if (isEditMode) {
        response = await API.put(`/services/${id}`, payload);
      } else {
        response = await API.post("/services", payload);
      }

      console.log("Service API Response:", response?.data);

      if (
        response?.data?.success === true ||
        response?.status === 200 ||
        response?.status === 201
      ) {
        setSaved(true);

        setTimeout(() => {
          navigate("/admin/services", {
            replace: true,
          });
        }, 900);

        return;
      }

      setError(
        response?.data?.message ||
          "Service could not be saved. Please try again.",
      );
    } catch (err) {
      console.error("Save Service Error:", err);

      if (err?.response?.status === 401) {
        clearAdminSession();

        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      if (err?.response?.status === 403) {
        setError("Admin access is required to manage services.");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Failed to save service. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";

    const fallback =
      e.currentTarget.parentElement?.querySelector(".image-fallback");

    if (fallback) {
      fallback.classList.remove("hidden");
      fallback.classList.add("flex");
    }
  };

  // =====================================================
  // IMAGE RESET
  // =====================================================

  const clearImage = () => {
    setImageFile(null);
    setFormData((previous) => ({
      ...previous,
      image: "",
    }));

    setSaved(false);
  };

  // =====================================================
  // CHARACTER COUNT
  // =====================================================

  const descriptionLength = formData.description.length;

  // =====================================================
  // COMPLETION
  // =====================================================

  const completion = useMemo(() => {
    const fields = [
      formData.name.trim(),
      formData.category,
      formData.description.trim(),
      formData.price,
      formData.duration,
    ];

    const completed = fields.filter(Boolean).length;

    return Math.round((completed / fields.length) * 100);
  }, [formData]);

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center shadow-xl shadow-slate-900/20">
            <Loader2 size={28} className="text-white animate-spin" />
          </div>

          <h2 className="mt-6 text-lg font-bold text-slate-900">
            Loading service
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your service editor...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* =================================================
          TOP HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[76px] flex items-center justify-between gap-4">
            {/* LEFT */}

            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/admin/services")}
                disabled={saving}
                className="
                  w-10 h-10
                  rounded-xl
                  border border-slate-200
                  bg-white
                  flex items-center justify-center
                  text-slate-600
                  hover:bg-slate-950
                  hover:text-white
                  hover:border-slate-950
                  transition-all duration-200
                  shrink-0
                  disabled:opacity-50
                "
              >
                <ArrowLeft size={19} />
              </button>

              <div className="min-w-0">
                {/* Breadcrumb */}

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <span>Admin</span>
                  <ChevronRight size={12} />
                  <span>Services</span>
                  <ChevronRight size={12} />
                  <span className="text-slate-600 font-medium">
                    {isEditMode ? "Edit" : "Create"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 truncate">
                    {isEditMode ? "Edit Service" : "Create New Service"}
                  </h1>

                  <span
                    className={`
                      hidden sm:inline-flex
                      items-center gap-1.5
                      px-2.5 py-1
                      rounded-full
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-wide
                      ${
                        isEditMode
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }
                    `}
                  >
                    <Sparkles size={11} />
                    {isEditMode ? "Editing" : "New"}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                Admin workspace
              </div>

              <div className="h-5 w-px bg-slate-200" />

              <div className="text-xs text-slate-400">
                {completion}% complete
              </div>
            </div>
          </div>

          {/* Progress */}

          <div className="h-[3px] bg-slate-100">
            <div
              className="h-full bg-slate-950 transition-all duration-500"
              style={{
                width: `${completion}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">
        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={19} className="text-red-600" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">
                  Something went wrong
                </p>

                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {saved && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={19} className="text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Service saved successfully
                </p>

                <p className="text-xs text-emerald-600 mt-0.5">
                  Redirecting you back to services...
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-7">
            {/* =================================================
                LEFT EDITOR
            ================================================= */}

            <div className="space-y-6">
              {/* =================================================
                  BASIC INFORMATION
              ================================================= */}

              <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_35px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center shrink-0">
                      <Layers3 size={21} />
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950">
                        Basic Information
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Define the identity and classification of your service.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* SERVICE NAME */}

                  <div>
                    <label className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-semibold text-slate-800">
                        Service name
                        <span className="text-red-500 ml-1">*</span>
                      </span>

                      <span className="text-[11px] text-slate-400">
                        Required
                      </span>
                    </label>

                    <div className="relative group">
                      <Tag
                        size={18}
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                          group-focus-within:text-slate-950
                          transition
                        "
                      />

                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Home Deep Cleaning"
                        className="
                          w-full
                          h-12
                          pl-11
                          pr-4
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/50
                          text-sm
                          font-medium
                          text-slate-900
                          placeholder:text-slate-400
                          outline-none
                          transition-all
                          focus:bg-white
                          focus:border-slate-950
                          focus:ring-4
                          focus:ring-slate-950/5
                        "
                      />
                    </div>
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Service category
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {categories.map((category) => {
                        const selected = formData.category === category;

                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() =>
                              handleChange({
                                target: {
                                  name: "category",
                                  value: category,
                                },
                              })
                            }
                            className={`
                              min-h-[48px]
                              px-3
                              rounded-xl
                              border
                              text-xs
                              sm:text-sm
                              font-semibold
                              text-left
                              transition-all
                              ${
                                selected
                                  ? "bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-950/10"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                              }
                            `}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DURATION */}

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2.5">
                      Estimated duration
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div className="relative">
                      <Clock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />

                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="
                          w-full
                          h-12
                          pl-11
                          pr-10
                          appearance-none
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/50
                          text-sm
                          font-medium
                          text-slate-900
                          outline-none
                          cursor-pointer
                          focus:bg-white
                          focus:border-slate-950
                          focus:ring-4
                          focus:ring-slate-950/5
                          transition
                        "
                      >
                        <option value="">Select service duration</option>

                        {durations.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PRICING & DESCRIPTION
              ================================================= */}

              <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_35px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CircleDollarSign size={21} />
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950">
                        Pricing & Description
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Tell customers what they receive and how much it costs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* PRICE */}

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm font-semibold text-slate-800">
                        Starting price
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <span className="text-[11px] text-slate-400">INR</span>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <IndianRupee size={15} className="text-emerald-600" />
                      </div>

                      <input
                        type="number"
                        name="price"
                        min="1"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="499"
                        className="
                          w-full
                          h-14
                          pl-14
                          pr-5
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/50
                          text-lg
                          font-bold
                          text-slate-900
                          placeholder:text-slate-300
                          outline-none
                          focus:bg-white
                          focus:border-emerald-500
                          focus:ring-4
                          focus:ring-emerald-500/10
                          transition
                        "
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      This is the starting price customers will see.
                    </p>
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm font-semibold text-slate-800">
                        Service description
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <span
                        className={`
                          text-[11px]
                          ${
                            descriptionLength > 450
                              ? "text-amber-600"
                              : "text-slate-400"
                          }
                        `}
                      >
                        {descriptionLength} characters
                      </span>
                    </div>

                    <div className="relative">
                      <FileText
                        size={18}
                        className="absolute left-4 top-4 text-slate-400"
                      />

                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={7}
                        maxLength={600}
                        placeholder="Describe what is included in this service, what customers can expect, and any important details..."
                        className="
                          w-full
                          pl-11
                          pr-5
                          py-4
                          rounded-2xl
                          border border-slate-200
                          bg-slate-50/50
                          text-sm
                          leading-6
                          text-slate-900
                          placeholder:text-slate-400
                          outline-none
                          resize-none
                          focus:bg-white
                          focus:border-slate-950
                          focus:ring-4
                          focus:ring-slate-950/5
                          transition
                        "
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  MEDIA
              ================================================= */}

              <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_35px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <ImageIcon size={21} />
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950">
                        Service Media
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Add a high-quality image to make the service more
                        attractive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <label className="block text-sm font-semibold text-slate-800 mb-2.5">
                    Upload Image
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    JPG, JPEG, PNG or WEBP. Maximum 5MB. Leave empty while editing to keep the current image.
                  </p>

                  {/* SMALL IMAGE PREVIEW */}

                  <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    {imageFile || formData.image ? (
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                        alt="Service"
                        onError={handleImageError}
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={30} />
                        <p className="text-xs mt-2">
                          Image preview will appear here
                        </p>
                      </div>
                    )}

                    <div className="image-fallback hidden h-44 flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={30} />
                      <p className="text-xs mt-2">Unable to load this image</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  STATUS
              ================================================= */}

              <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_35px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Globe2 size={21} />
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950">
                        Visibility
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Control whether customers can see this service.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* ACTIVE */}

                    <button
                      type="button"
                      onClick={() => handleStatusChange("Active")}
                      className={`
                        group
                        p-5
                        rounded-2xl
                        border
                        text-left
                        transition-all
                        ${
                          formData.status === "Active"
                            ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-10 h-10 rounded-xl flex items-center justify-center
                              ${
                                formData.status === "Active"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }
                            `}
                          >
                            <CheckCircle size={19} />
                          </div>

                          <div>
                            <p
                              className={`font-bold text-sm ${
                                formData.status === "Active"
                                  ? "text-emerald-800"
                                  : "text-slate-800"
                              }`}
                            >
                              Active
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Visible to customers
                            </p>
                          </div>
                        </div>

                        {formData.status === "Active" && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle size={13} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* INACTIVE */}

                    <button
                      type="button"
                      onClick={() => handleStatusChange("Inactive")}
                      className={`
                        group
                        p-5
                        rounded-2xl
                        border
                        text-left
                        transition-all
                        ${
                          formData.status === "Inactive"
                            ? "border-red-300 bg-red-50/70 ring-2 ring-red-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-10 h-10 rounded-xl flex items-center justify-center
                              ${
                                formData.status === "Inactive"
                                  ? "bg-red-500 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }
                            `}
                          >
                            <AlertCircle size={19} />
                          </div>

                          <div>
                            <p
                              className={`font-bold text-sm ${
                                formData.status === "Inactive"
                                  ? "text-red-800"
                                  : "text-slate-800"
                              }`}
                            >
                              Inactive
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Hidden from customers
                            </p>
                          </div>
                        </div>

                        {formData.status === "Inactive" && (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <CheckCircle size={13} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <aside className="xl:sticky xl:top-[105px] h-fit space-y-5">
              {/* =================================================
                  LIVE PREVIEW
              ================================================= */}

              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] overflow-hidden">
                {/* PREVIEW HEADER */}

                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                      <Eye size={15} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        Live Preview
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Customer view
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                    PREVIEW
                  </span>
                </div>

                {/* IMAGE */}

                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt={formData.name || "Service preview"}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  )}

                  <div
                    className={`
                      image-fallback
                      absolute
                      inset-0
                      flex-col
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-slate-100
                      to-slate-200
                      text-slate-400
                      ${formData.image ? "hidden" : "flex"}
                    `}
                  >
                    <ImageIcon size={38} />

                    <p className="text-xs font-medium mt-2">No service image</p>
                  </div>

                  {/* STATUS OVERLAY */}

                  <div className="absolute top-3 left-3">
                    {formData.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur text-emerald-700 text-[10px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur text-red-700 text-[10px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        INACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* CONTENT */}

                <div className="p-5">
                  {formData.category ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                      <Tag size={11} />
                      {formData.category}
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold">
                      CATEGORY
                    </span>
                  )}

                  <h3 className="text-xl font-bold tracking-tight text-slate-950 mt-3 break-words">
                    {formData.name || "Your Service Name"}
                  </h3>

                  <p className="text-sm text-slate-500 leading-5 mt-2 line-clamp-4 min-h-[80px]">
                    {formData.description ||
                      "Your service description will appear here. Add a clear description to help customers understand what this service includes."}
                  </p>

                  {/* PRICE / DURATION */}

                  <div className="grid grid-cols-2 gap-2.5 mt-5">
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                        Starting from
                      </p>

                      <div className="flex items-center gap-1 mt-2">
                        <IndianRupee size={14} className="text-slate-700" />

                        <span className="font-bold text-slate-950 truncate">
                          {formData.price
                            ? Number(formData.price).toLocaleString("en-IN")
                            : "0"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                        Duration
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={14} className="text-slate-700 shrink-0" />

                        <span className="font-semibold text-slate-950 text-xs truncate">
                          {formData.duration || "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VIEW DETAILS */}

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Customer-facing preview
                    </span>

                    <ExternalLink size={14} className="text-slate-300" />
                  </div>
                </div>
              </div>

              {/* =================================================
                  SERVICE SUMMARY
              ================================================= */}

              <div className="bg-slate-950 rounded-3xl p-5 text-white shadow-xl shadow-slate-950/10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Sparkles size={15} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">Service Summary</p>

                    <p className="text-[10px] text-white/50">
                      Configuration overview
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-xs text-white/50">Category</span>

                    <span className="text-xs font-semibold text-white">
                      {formData.category || "Not selected"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-xs text-white/50">Duration</span>

                    <span className="text-xs font-semibold text-white">
                      {formData.duration || "Not selected"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-xs text-white/50">
                      Starting price
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {formData.price
                        ? `₹${Number(formData.price).toLocaleString("en-IN")}`
                        : "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-white/50">Visibility</span>

                    <span
                      className={`text-xs font-bold ${
                        formData.status === "Active"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  HELP CARD
              ================================================= */}

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Quality matters
                    </p>

                    <p className="text-xs leading-5 text-slate-500 mt-1">
                      Use a clear service name, accurate pricing, helpful
                      description and high-quality image.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* =================================================
              BOTTOM ACTION BAR
          ================================================= */}

          <div className="mt-7">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_35px_rgba(15,23,42,0.05)] px-5 sm:px-7 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* LEFT */}

                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-9 h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        completion === 100
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    {completion === 100 ? (
                      <CheckCircle size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {completion === 100
                        ? "Ready to publish"
                        : "Complete the required fields"}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {completion}% of required information completed
                    </p>
                  </div>
                </div>

                {/* RIGHT */}

                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/services")}
                    disabled={saving}
                    className="
                      h-11
                      px-5
                      rounded-xl
                      border border-slate-200
                      bg-white
                      text-slate-700
                      text-sm
                      font-bold
                      hover:bg-slate-50
                      hover:border-slate-300
                      transition
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      h-11
                      px-6
                      rounded-xl
                      bg-slate-950
                      text-white
                      text-sm
                      font-bold
                      flex
                      items-center
                      justify-center
                      gap-2
                      shadow-lg
                      shadow-slate-950/15
                      hover:bg-slate-800
                      hover:-translate-y-0.5
                      active:translate-y-0
                      transition-all
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                  >
                    {saving ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />

                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save size={17} />

                        {isEditMode ? "Update Service" : "Create Service"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ServiceForm;
