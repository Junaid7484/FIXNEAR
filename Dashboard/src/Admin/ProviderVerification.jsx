import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ShieldCheck,
  User,
  BriefcaseBusiness,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
  BadgeCheck,
  Building2,
  IndianRupee,
  CircleCheck,
  CircleX,
} from "lucide-react";

function ProviderVerification() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --------------------------------------------------
  // DEMO PROVIDER DATA
  // --------------------------------------------------

  const providers = [
    {
      id: "PROV-1001",
      name: "Rahul Sharma",
      businessName: "Sharma Electrical Services",
      category: "Electrical",
      serviceType: "Electrical Repair",
      experience: "8 Years",
      phone: "+91 98765 43210",
      email: "rahul.sharma@example.com",
      address: "Tilka Manjhi",
      city: "Bhagalpur",
      state: "Bihar",
      pincode: "812001",
      description:
        "Professional electrical repair and installation services for homes and small businesses.",
      startingPrice: 299,
      applicationDate: "18 September 2026",
      status: "Verified",
      profileImage: "",
    },
    {
      id: "PROV-1002",
      name: "Amit Kumar",
      businessName: "Kumar Plumbing Solutions",
      category: "Plumbing",
      serviceType: "Plumbing Repair",
      experience: "6 Years",
      phone: "+91 98765 43211",
      email: "amit.kumar@example.com",
      address: "Adampur",
      city: "Bhagalpur",
      state: "Bihar",
      pincode: "812001",
      description:
        "Residential plumbing repair, bathroom plumbing and pipe maintenance services.",
      startingPrice: 249,
      applicationDate: "17 September 2026",
      status: "Verified",
      profileImage: "",
    },
    {
      id: "PROV-1006",
      name: "Vikash Kumar",
      businessName: "ColorCraft Painters",
      category: "Painting",
      serviceType: "Home Painting",
      experience: "7 Years",
      phone: "+91 98765 43215",
      email: "vikash.kumar@example.com",
      address: "Barari",
      city: "Bhagalpur",
      state: "Bihar",
      pincode: "812003",
      description:
        "Interior and exterior painting services with professional finishing for residential properties.",
      startingPrice: 2499,
      applicationDate: "23 September 2026",
      status: "Pending",
      profileImage: "",
    },
    {
      id: "PROV-1007",
      name: "Deepak Singh",
      businessName: "Singh Home Repair",
      category: "Home Repair",
      serviceType: "General Home Repair",
      experience: "5 Years",
      phone: "+91 98765 43216",
      email: "deepak.singh@example.com",
      address: "Nathnagar",
      city: "Bhagalpur",
      state: "Bihar",
      pincode: "812006",
      description:
        "General home maintenance and repair services including doors, fittings and minor repairs.",
      startingPrice: 399,
      applicationDate: "24 September 2026",
      status: "Pending",
      profileImage: "",
    },
  ];

  const provider = providers.find((item) => item.id === id) || providers[2];

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [status, setStatus] = useState(provider.status);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const [checklist, setChecklist] = useState({
    identity: false,
    contact: false,
    address: false,
    documents: false,
    service: false,
    terms: true,
  });

  // --------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------

  const documents = [
    {
      id: 1,
      name: "Government ID Proof",
      type: "Aadhaar Card",
      status: "Uploaded",
      fileName: "rahul-id-proof.pdf",
    },
    {
      id: 2,
      name: "Address Proof",
      type: "Address Verification",
      status: "Uploaded",
      fileName: "address-proof.pdf",
    },
    {
      id: 3,
      name: "Experience Certificate",
      type: "Professional Certificate",
      status: "Uploaded",
      fileName: "experience-certificate.pdf",
    },
    {
      id: 4,
      name: "Business Document",
      type: "Business Registration",
      status: "Uploaded",
      fileName: "business-document.pdf",
    },
  ];

  // --------------------------------------------------
  // SERVICES
  // --------------------------------------------------

  const services = [
    {
      name: "Wall Painting",
      price: "₹1,499",
      duration: "2-4 Hours",
    },
    {
      name: "Room Painting",
      price: "₹2,499",
      duration: "4-6 Hours",
    },
    {
      name: "Full Home Painting",
      price: "₹7,999",
      duration: "2-4 Days",
    },
    {
      name: "Exterior Painting",
      price: "₹4,999",
      duration: "1-2 Days",
    },
  ];

  // --------------------------------------------------
  // TIMELINE
  // --------------------------------------------------

  const timeline = [
    {
      title: "Application Submitted",
      date: "23 September 2026",
      completed: true,
    },
    {
      title: "Documents Uploaded",
      date: "23 September 2026",
      completed: true,
    },
    {
      title: "Application Under Review",
      date: "24 September 2026",
      completed: true,
    },
    {
      title: "Verification Decision",
      date:
        status === "Pending"
          ? "Waiting for admin decision"
          : "Decision completed",
      completed: status !== "Pending",
    },
  ];

  // --------------------------------------------------
  // CHECKLIST
  // --------------------------------------------------

  const toggleChecklist = (key) => {
    setChecklist((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const allChecksCompleted = Object.values(checklist).every(Boolean);

  // --------------------------------------------------
  // APPROVE
  // --------------------------------------------------

  const approveProvider = () => {
    setStatus("Verified");
    setShowApproveModal(false);

    setTimeout(() => {
      navigate("/admin/providers");
    }, 700);
  };

  // --------------------------------------------------
  // REJECT
  // --------------------------------------------------

  const rejectProvider = () => {
    if (!rejectionReason) {
      alert("Please select a rejection reason.");
      return;
    }

    setStatus("Rejected");
    setShowRejectModal(false);

    setTimeout(() => {
      navigate("/admin/providers");
    }, 700);
  };

  // --------------------------------------------------
  // STATUS STYLE
  // --------------------------------------------------

  const statusStyles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Suspended: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================
                    HEADER
                ========================================= */}

        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/providers")}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 mb-5"
          >
            <ArrowLeft size={18} />
            Back to Providers
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Admin / Providers / Verification
                  </p>

                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Provider Verification
                  </h1>
                </div>
              </div>

              <p className="text-slate-500 text-sm">
                Review provider information and submitted documents before
                making a verification decision.
              </p>
            </div>

            <div
              className={`inline-flex self-start lg:self-auto items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${
                statusStyles[status] || statusStyles.Pending
              }`}
            >
              {status === "Verified" ? (
                <CheckCircle2 size={17} />
              ) : status === "Rejected" ? (
                <XCircle size={17} />
              ) : (
                <Clock3 size={17} />
              )}

              {status === "Pending" ? "Pending Verification" : status}
            </div>
          </div>
        </div>

        {/* =========================================
                    PROVIDER SUMMARY
                ========================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <User size={38} />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {provider.name}
                </h2>

                {status === "Verified" && (
                  <BadgeCheck size={21} className="text-emerald-600" />
                )}
              </div>

              <p className="font-medium text-slate-700">
                {provider.businessName}
              </p>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BriefcaseBusiness size={16} />
                  {provider.category}
                </span>

                <span className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {provider.city}, {provider.state}
                </span>

                <span className="flex items-center gap-1.5">
                  <CalendarDays size={16} />
                  Applied {provider.applicationDate}
                </span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-slate-500 mb-1">Application ID</p>

              <p className="font-bold text-blue-600">{provider.id}</p>
            </div>
          </div>
        </div>

        {/* =========================================
                    MAIN GRID
                ========================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* =====================================
                        LEFT / MAIN CONTENT
                    ===================================== */}

          <div className="xl:col-span-2 space-y-6">
            {/* Provider Information */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <User className="text-blue-600" size={21} />

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Provider Information
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Personal and business application details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem
                  icon={<User size={17} />}
                  label="Provider Name"
                  value={provider.name}
                />

                <InfoItem
                  icon={<Building2 size={17} />}
                  label="Business Name"
                  value={provider.businessName}
                />

                <InfoItem
                  icon={<BriefcaseBusiness size={17} />}
                  label="Category"
                  value={provider.category}
                />

                <InfoItem
                  icon={<BriefcaseBusiness size={17} />}
                  label="Service Type"
                  value={provider.serviceType}
                />

                <InfoItem
                  icon={<Clock3 size={17} />}
                  label="Experience"
                  value={provider.experience}
                />

                <InfoItem
                  icon={<IndianRupee size={17} />}
                  label="Starting Price"
                  value={`₹${provider.startingPrice}`}
                />

                <InfoItem
                  icon={<Phone size={17} />}
                  label="Phone"
                  value={provider.phone}
                />

                <InfoItem
                  icon={<Mail size={17} />}
                  label="Email"
                  value={provider.email}
                />

                <InfoItem
                  icon={<MapPin size={17} />}
                  label="Address"
                  value={`${provider.address}, ${provider.city}`}
                />

                <InfoItem
                  icon={<MapPin size={17} />}
                  label="State / Pincode"
                  value={`${provider.state} - ${provider.pincode}`}
                />
              </div>

              <div className="px-5 pb-5">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Provider Description
                  </p>

                  <p className="text-sm text-slate-700 leading-6">
                    {provider.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Documents */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={21} />

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Verification Documents
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Review documents submitted by the provider
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                  {documents.length} Documents
                </span>
              </div>

              <div className="p-5 space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <FileText size={21} />
                      </div>

                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {document.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {document.type} • {document.fileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                        {document.status}
                      </span>

                      <button
                        onClick={() => setSelectedDocument(document)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        onClick={() =>
                          alert(`Demo download: ${document.fileName}`)
                        }
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Services */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="text-blue-600" size={21} />

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Submitted Services
                    </h2>

                    <p className="text-xs text-slate-500">
                      Services the provider wants to offer
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((service, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {service.name}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {service.duration}
                          </p>
                        </div>

                        <p className="font-bold text-blue-600 text-sm">
                          {service.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* =====================================
                        RIGHT SIDEBAR
                    ===================================== */}

          <div className="space-y-6">
            {/* Verification Checklist */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-blue-600" size={21} />

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Verification Checklist
                    </h2>

                    <p className="text-xs text-slate-500">
                      Complete all checks before approval
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <ChecklistItem
                  label="Identity verified"
                  checked={checklist.identity}
                  onClick={() => toggleChecklist("identity")}
                />

                <ChecklistItem
                  label="Contact information verified"
                  checked={checklist.contact}
                  onClick={() => toggleChecklist("contact")}
                />

                <ChecklistItem
                  label="Address verified"
                  checked={checklist.address}
                  onClick={() => toggleChecklist("address")}
                />

                <ChecklistItem
                  label="Documents are valid"
                  checked={checklist.documents}
                  onClick={() => toggleChecklist("documents")}
                />

                <ChecklistItem
                  label="Service information reviewed"
                  checked={checklist.service}
                  onClick={() => toggleChecklist("service")}
                />

                <ChecklistItem
                  label="Terms accepted"
                  checked={checklist.terms}
                  onClick={() => toggleChecklist("terms")}
                />

                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium ${
                    allChecksCompleted
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {allChecksCompleted
                    ? "All verification checks are completed."
                    : "Complete all checklist items before approving this provider."}
                </div>
              </div>
            </section>

            {/* Decision */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-slate-900">
                Verification Decision
              </h2>

              <p className="text-xs text-slate-500 mt-1 mb-5">
                Choose the appropriate action after reviewing the application.
              </p>

              <div className="space-y-3">
                <button
                  disabled={status !== "Pending" || !allChecksCompleted}
                  onClick={() => setShowApproveModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                  <CheckCircle2 size={19} />
                  Approve Provider
                </button>

                <button
                  disabled={status !== "Pending"}
                  onClick={() => setShowRejectModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                  <XCircle size={19} />
                  Reject Application
                </button>
              </div>

              {!allChecksCompleted && status === "Pending" && (
                <p className="flex items-start gap-2 text-xs text-amber-600 mt-4">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  Complete every checklist item to enable approval.
                </p>
              )}
            </section>

            {/* Timeline */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Clock3 className="text-blue-600" size={21} />

                  <h2 className="font-bold text-slate-900">
                    Application Timeline
                  </h2>
                </div>
              </div>

              <div className="p-5">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.completed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {item.completed ? (
                          <CircleCheck size={17} />
                        ) : (
                          <Clock3 size={17} />
                        )}
                      </div>

                      {index !== timeline.length - 1 && (
                        <div className="w-px h-10 bg-slate-200" />
                      )}
                    </div>

                    <div className="pb-5">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================
                DOCUMENT PREVIEW MODAL
            ========================================= */}

      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedDocument.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {selectedDocument.fileName}
                </p>
              </div>

              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="h-64 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                <FileText size={52} />

                <p className="font-semibold mt-3 text-slate-600">
                  Document Preview
                </p>

                <p className="text-xs mt-1">Demo document viewer</p>
              </div>

              <button
                onClick={() =>
                  alert(`Demo download: ${selectedDocument.fileName}`)
                }
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                <Download size={18} />
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
                APPROVE MODAL
            ========================================= */}

      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 size={26} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Approve Provider?
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-6">
              Are you sure you want to verify{" "}
              <span className="font-semibold text-slate-700">
                {provider.businessName}
              </span>
              ? The provider will become available for customers.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={approveProvider}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
                REJECT MODAL
            ========================================= */}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle size={24} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Reject Application
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Provide a reason for rejection.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rejection Reason
              </label>

              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>

                <option value="Invalid documents">Invalid documents</option>

                <option value="Incomplete information">
                  Incomplete information
                </option>

                <option value="Identity verification failed">
                  Identity verification failed
                </option>

                <option value="Address verification failed">
                  Address verification failed
                </option>

                <option value="Service information not valid">
                  Service information not valid
                </option>

                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-semibold text-slate-700 mt-5 mb-2">
                Admin Note
              </label>

              <textarea
                rows="4"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Write an optional note..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={rejectProvider}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// CHECKLIST ITEM
// ======================================================

function ChecklistItem({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left group"
    >
      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
          checked
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "border-slate-300 bg-white group-hover:border-blue-400"
        }`}
      >
        {checked && <CheckCircle2 size={14} />}
      </div>

      <span
        className={`text-sm ${checked ? "text-slate-700" : "text-slate-500"}`}
      >
        {label}
      </span>
    </button>
  );
}

export default ProviderVerification;
