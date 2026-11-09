import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FolderTree,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import API from "../services/api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isActive: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // AUTH ERROR HANDLER
  // ==========================================
  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  // ==========================================
  // FETCH CATEGORY FOR EDIT
  // ==========================================
  useEffect(() => {
    if (isEditMode) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/categories/${id}`);

      if (response.data?.success) {
        const category = response.data.category;

        setFormData({
          name: category?.name || "",
          description: category?.description || "",
          image: category?.image || "",
          isActive:
            typeof category?.isActive === "boolean" ? category.isActive : true,
        });
      } else {
        setError(response.data?.message || "Failed to load category.");
      }
    } catch (err) {
      console.error("Fetch Category Error:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Failed to load category.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(formData.image || "");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, formData.image]);

  // ==========================================
  // HANDLE TEXT INPUTS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE STATUS
  // ==========================================
  const handleStatusChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      isActive: value,
    }));
  };

  // ==========================================
  // HANDLE GALLERY IMAGE SELECTION
  // ==========================================
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");

      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5MB or smaller.");

      e.target.value = "";
      return;
    }

    setImageFile(file);
  };

  // ==========================================
  // REMOVE SELECTED IMAGE
  // ==========================================
  const handleRemoveSelectedImage = () => {
    setImageFile(null);

    const fileInput = document.getElementById("image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ==========================================
  // VALIDATION
  // ==========================================
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Category name is required.");
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError("Category name must contain at least 2 characters.");
      return false;
    }

    if (formData.name.trim().length > 100) {
      setError("Category name cannot exceed 100 characters.");
      return false;
    }

    if (formData.description.trim().length > 500) {
      setError("Description cannot exceed 500 characters.");
      return false;
    }

    return true;
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = new FormData();

      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("isActive", String(formData.isActive));

      // Send the actual selected file.
      // The backend will upload it to Cloudinary.
      if (imageFile) {
        payload.append("image", imageFile);
      }

      let response;

      if (isEditMode) {
        response = await API.put(`/categories/${id}`, payload);
      } else {
        response = await API.post("/categories", payload);
      }

      if (response.data?.success) {
        setSuccess(
          isEditMode
            ? "Category updated successfully."
            : "Category created successfully.",
        );

        setTimeout(() => {
          navigate("/admin/categories");
        }, 800);
      } else {
        setError(response.data?.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Save Category Error:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err.response?.status === 403) {
        setError("You are not authorized to manage categories.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to save category. Check your backend and image upload configuration.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex min-h-125 max-w-7xl items-center justify-center">
          <div className="text-center">
            <Loader2
              size={42}
              className="mx-auto animate-spin text-indigo-600"
            />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading category...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <FolderTree size={22} className="text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {isEditMode ? "Edit Category" : "Create Category"}
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Update category information and status."
                : "Add a new service category to FIXNEAR."}
            </p>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Unable to save category</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Success</p>
              <p className="mt-1 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CATEGORY FORM */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Category Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details for this category.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {/* CATEGORY NAME */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Category Name
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Electrical"
                    maxLength={100}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />

                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-slate-400">
                      {formData.name.length}/100
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the services included in this category..."
                    maxLength={500}
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />

                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-slate-400">
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>

                {/* GALLERY IMAGE UPLOAD */}
                <div>
                  <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Category Image
                  </label>

                  <label
                    htmlFor="image"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <Upload size={30} className="mb-3 text-indigo-600" />

                    <span className="text-sm font-semibold text-slate-700">
                      Choose image from your gallery
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      JPG, PNG or WEBP — maximum 5MB
                    </span>
                  </label>

                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    disabled={saving}
                    className="sr-only"
                  />

                  {/* SELECTED IMAGE DETAILS */}
                  {imageFile && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <ImageIcon
                          size={20}
                          className="shrink-0 text-indigo-600"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {imageFile.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(imageFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveSelectedImage}
                        disabled={saving}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                        aria-label="Remove selected image"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    {isEditMode
                      ? "Select a new image to replace the current one. Leave unchanged to keep the existing image."
                      : "Select an image from your computer. It will upload when you save the category."}
                  </p>
                </div>

                {/* CATEGORY STATUS */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Category Status
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(true)}
                      disabled={saving}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        formData.isActive
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle
                        size={22}
                        className={
                          formData.isActive
                            ? "text-emerald-600"
                            : "text-slate-400"
                        }
                      />

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Active
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Visible to customers
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(false)}
                      disabled={saving}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        !formData.isActive
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <XCircle
                        size={22}
                        className={
                          !formData.isActive ? "text-red-600" : "text-slate-400"
                        }
                      />

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Inactive
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Hidden from customers
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* FORM FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={() => navigate("/admin/categories")}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading and saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {isEditMode ? "Update Category" : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* LIVE PREVIEW */}
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Live Preview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preview how the category will appear.
                </p>
              </div>

              <div className="p-5">
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={formData.name || "Category preview"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={34} />
                      <p className="mt-2 text-sm">No image selected</p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="wrap-break-words text-xl font-bold text-slate-900">
                      {formData.name || "Category Name"}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        formData.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-500">
                    {formData.description ||
                      "Category description will appear here."}
                  </p>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <FolderTree size={18} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Category
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        FIXNEAR Services
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
