import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock,
  Image as ImageIcon,
  IndianRupee,
  Save,
  Wrench,
} from "lucide-react";
import API from "../services/api";

function ProviderServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const demoServices = [
    {
      _id: "service-101",
      name: "Fan Installation & Repair",
      category: "Electrical",
      description:
        "Professional ceiling fan installation, repair and replacement service.",
      price: "299",
      duration: "45-60 min",
      image: "",
      active: true,
    },
    {
      _id: "service-102",
      name: "Switch & Socket Repair",
      category: "Electrical",
      description:
        "Repair and replacement of damaged switches and electrical sockets.",
      price: "199",
      duration: "30-45 min",
      image: "",
      active: true,
    },
    {
      _id: "service-103",
      name: "Electrical Wiring",
      category: "Electrical",
      description:
        "Professional electrical wiring for rooms, homes and small offices.",
      price: "799",
      duration: "2-4 hours",
      image: "",
      active: true,
    },
    {
      _id: "service-104",
      name: "Inverter Installation",
      category: "Electrical",
      description:
        "Safe installation and basic setup of home inverter systems.",
      price: "499",
      duration: "60-90 min",
      image: "",
      active: false,
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    image: "",
    active: true,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const servicesResponse = await API.get("/services");
        const masterServices = servicesResponse.data?.services || servicesResponse.data?.data || [];
        setServices(masterServices);

        if (isEditMode) {
          const response = await API.get("/providers/services/my");
          const providerServices = response.data?.services || [];
          const item = providerServices.find((service) => service?._id === id);
          const master = item?.service;
          if (item) {
            setFormData({
              name: master?.name || "",
              category: master?.category || "",
              description: item.description || master?.description || "",
              price: item.price ?? "",
              duration: item.duration ? `${item.duration} min` : "60-90 min",
              image: item.image || master?.image || "",
              active: item.isActive !== false,
            });
          }
        }
      } catch (error) {
        console.error("Load Provider Service Form Error:", error);
        setErrors({ general: error.response?.data?.message || "Failed to load services." });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  const categories = [
    "Electrical",
    "Plumbing",
    "AC & Appliance Repair",
    "Cleaning",
    "Carpentry",
    "Painting",
  ];

  const durations = [
    "30-45 min",
    "45-60 min",
    "60-90 min",
    "2-4 hours",
    "4-6 hours",
    "Full Day",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required.";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Service description is required.";
    } else if (formData.description.trim().length < 20) {
      newErrors.description =
        "Description should contain at least 20 characters.";
    }

    if (!formData.price) {
      newErrors.price = "Price is required.";
    } else if (Number(formData.price) <= 0) {
      newErrors.price = "Price must be greater than ₹0.";
    }

    if (!formData.duration) {
      newErrors.duration = "Please select service duration.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrors((prev) => ({ ...prev, image: "Please select a valid image file." })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors((prev) => ({ ...prev, image: "Image must be 5MB or smaller." })); return; }
    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const selectedService = services.find((service) => service?.name === formData.name);
    if (!selectedService?._id) {
      setErrors((prev) => ({ ...prev, name: "Please select a valid service from the service catalog." }));
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("service", selectedService._id);
      payload.append("price", String(Number(formData.price)));
      payload.append("description", formData.description.trim());
      payload.append("isActive", String(Boolean(formData.active)));
      if (formData.duration) {
        const minutes = parseInt(formData.duration, 10);
        if (!Number.isNaN(minutes)) payload.append("duration", String(minutes));
      }
      if (imageFile) payload.append("image", imageFile);

      const response = isEditMode
        ? await API.put(`/providers/services/my/${id}`, payload)
        : await API.post("/providers/services/my", payload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save service.");
      }

      setSaved(true);
      setTimeout(() => navigate("/provider/services"), 900);
    } catch (error) {
      console.error("Save Provider Service Error:", error);
      setErrors((prev) => ({ ...prev, general: error.response?.data?.message || error.message || "Failed to save service." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link
          to="/provider/services"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium mb-6"
        >
          <ArrowLeft size={18} />
          Back to Services
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">Provider Panel</p>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            {isEditMode ? "Edit Service" : "Add New Service"}
          </h1>

          <p className="text-slate-500 mt-2">
            {isEditMode
              ? "Update your service information and pricing."
              : "Add a service that customers can book from your profile."}
          </p>
        </div>

        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
            {errors.general}
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 flex items-center gap-3">
            <Check size={20} />

            <div>
              <p className="font-semibold">Service saved successfully.</p>

              <p className="text-sm">Redirecting to your services...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic information */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wrench size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Basic Information
                    </h2>

                    <p className="text-sm text-slate-500">
                      Enter the main details of your service.
                    </p>
                  </div>
                </div>

                {/* Service name */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Name
                  </label>

                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isEditMode || loadingData}
                    className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.name ? "border-red-400" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>

                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1.5">{errors.name}</p>
                  )}
                </div>

                {/* Category */}
                <div className="mt-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.category ? "border-red-400" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1.5">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="mt-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Describe what is included in this service..."
                    className={`w-full border rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.description ? "border-red-400" : "border-slate-200"
                    }`}
                  />

                  <div className="flex justify-between mt-1.5">
                    {errors.description ? (
                      <p className="text-sm text-red-500">
                        {errors.description}
                      </p>
                    ) : (
                      <span></span>
                    )}

                    <span className="text-xs text-slate-400">
                      {formData.description.length} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <IndianRupee size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Pricing & Duration
                    </h2>

                    <p className="text-sm text-slate-500">
                      Set your service price and estimated time.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mt-6">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Starting Price
                    </label>

                    <div className="relative">
                      <IndianRupee
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="1"
                        placeholder="299"
                        className={`w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 ${
                          errors.price ? "border-red-400" : "border-slate-200"
                        }`}
                      />
                    </div>

                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1.5">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Estimated Duration
                    </label>

                    <div className="relative">
                      <Clock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className={`w-full border rounded-xl pl-11 pr-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-200 ${
                          errors.duration
                            ? "border-red-400"
                            : "border-slate-200"
                        }`}
                      >
                        <option value="">Select duration</option>

                        {durations.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}
                          </option>
                        ))}
                      </select>
                    </div>

                    {errors.duration && (
                      <p className="text-sm text-red-500 mt-1.5">
                        {errors.duration}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Service Image
                    </h2>

                    <p className="text-sm text-slate-500">
                      Upload an image for your service.
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="w-full mt-6 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-slate-400 mt-2">JPG, JPEG, PNG or WEBP. Maximum 5MB.</p>

                {imageFile && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Service preview"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Side panel */}
            <div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold text-slate-900">
                  Service Availability
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Control whether customers can currently book this service.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      active: !prev.active,
                    }))
                  }
                  className={`w-full mt-6 flex items-center justify-between border rounded-xl p-4 transition-colors ${
                    formData.active
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">
                      {formData.active ? "Service Active" : "Service Inactive"}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {formData.active
                        ? "Customers can book this service."
                        : "Customers cannot book this service."}
                    </p>
                  </div>

                  <div
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      formData.active ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        formData.active ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                </button>

                {/* Preview */}
                <div className="mt-6 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase">
                    Preview
                  </p>

                  <div className="mt-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <Wrench size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {formData.name || "Service Name"}
                      </h3>

                      <p className="text-xs text-blue-600 mt-1">
                        {formData.category || "Category"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-blue-600">
                      ₹{formData.price || "0"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formData.duration || "Duration"}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    disabled={saving || saved}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {isEditMode ? "Update Service" : "Save Service"}
                      </>
                    )}
                  </button>

                  <Link
                    to="/provider/services"
                    className="w-full flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProviderServiceForm;
