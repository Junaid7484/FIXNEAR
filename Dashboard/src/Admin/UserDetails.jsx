import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";

function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [status, setStatus] = useState("Active");

  // ============================================
  // Demo Users
  // ============================================

  const users = [
    {
      id: "USR-1001",
      name: "Aman Kumar",
      email: "aman@example.com",
      phone: "+91 98765 10001",
      role: "Customer",
      location: "Tilka Manjhi, Bhagalpur, Bihar",
      joined: "22 September 2026",
      lastLogin: "25 September 2026, 10:32 AM",
      bookings: 12,
      completedBookings: 9,
      cancelledBookings: 1,
      pendingBookings: 2,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "A",
    },
    {
      id: "USR-1002",
      name: "Priya Singh",
      email: "priya@example.com",
      phone: "+91 98765 10002",
      role: "Customer",
      location: "Nathnagar, Bhagalpur, Bihar",
      joined: "20 September 2026",
      lastLogin: "24 September 2026, 06:20 PM",
      bookings: 8,
      completedBookings: 7,
      cancelledBookings: 1,
      pendingBookings: 0,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "P",
    },
    {
      id: "USR-1003",
      name: "Rohit Singh",
      email: "rohit@example.com",
      phone: "+91 98765 10003",
      role: "Customer",
      location: "Adampur, Bhagalpur, Bihar",
      joined: "18 September 2026",
      lastLogin: "25 September 2026, 09:15 AM",
      bookings: 15,
      completedBookings: 12,
      cancelledBookings: 1,
      pendingBookings: 2,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "R",
    },
    {
      id: "USR-1004",
      name: "Neha Kumari",
      email: "neha@example.com",
      phone: "+91 98765 10004",
      role: "Customer",
      location: "Kachahri Road, Bhagalpur, Bihar",
      joined: "15 September 2026",
      lastLogin: "23 September 2026, 02:45 PM",
      bookings: 6,
      completedBookings: 5,
      cancelledBookings: 0,
      pendingBookings: 1,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "N",
    },
    {
      id: "USR-1005",
      name: "Vikash Kumar",
      email: "vikash@example.com",
      phone: "+91 98765 10005",
      role: "Provider",
      location: "Barari, Bhagalpur, Bihar",
      joined: "12 September 2026",
      lastLogin: "25 September 2026, 11:10 AM",
      bookings: 38,
      completedBookings: 34,
      cancelledBookings: 2,
      pendingBookings: 2,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "V",
    },
    {
      id: "USR-1006",
      name: "Sanjay Kumar",
      email: "sanjay@example.com",
      phone: "+91 98765 10006",
      role: "Provider",
      location: "Sabour Road, Bhagalpur, Bihar",
      joined: "10 September 2026",
      lastLogin: "24 September 2026, 08:40 PM",
      bookings: 24,
      completedBookings: 20,
      cancelledBookings: 2,
      pendingBookings: 2,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "S",
    },
    {
      id: "USR-1007",
      name: "Pooja Kumari",
      email: "pooja@example.com",
      phone: "+91 98765 10007",
      role: "Customer",
      location: "Barari, Bhagalpur, Bihar",
      joined: "08 September 2026",
      lastLogin: "22 September 2026, 04:25 PM",
      bookings: 10,
      completedBookings: 8,
      cancelledBookings: 1,
      pendingBookings: 1,
      status: "Active",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "P",
    },
    {
      id: "USR-1008",
      name: "Arun Kumar",
      email: "arun@example.com",
      phone: "+91 98765 10008",
      role: "Customer",
      location: "Tilka Manjhi, Bhagalpur, Bihar",
      joined: "04 September 2026",
      lastLogin: "18 September 2026, 10:20 AM",
      bookings: 4,
      completedBookings: 3,
      cancelledBookings: 1,
      pendingBookings: 0,
      status: "Inactive",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "A",
    },
    {
      id: "USR-1009",
      name: "Deepak Singh",
      email: "deepak@example.com",
      phone: "+91 98765 10009",
      role: "Provider",
      location: "Nathnagar, Bhagalpur, Bihar",
      joined: "02 September 2026",
      lastLogin: "20 September 2026, 01:30 PM",
      bookings: 19,
      completedBookings: 15,
      cancelledBookings: 2,
      pendingBookings: 2,
      status: "Pending",
      verified: false,
      emailVerified: true,
      phoneVerified: false,
      avatar: "D",
    },
    {
      id: "USR-1010",
      name: "Rahul Kumar",
      email: "rahul@example.com",
      phone: "+91 98765 10010",
      role: "Customer",
      location: "Adampur, Bhagalpur, Bihar",
      joined: "30 August 2026",
      lastLogin: "15 September 2026, 07:15 PM",
      bookings: 7,
      completedBookings: 5,
      cancelledBookings: 2,
      pendingBookings: 0,
      status: "Blocked",
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: "R",
    },
  ];

  const user = users.find((item) => item.id === id) || users[0];

  // ============================================
  // Demo Bookings
  // ============================================

  const recentBookings = [
    {
      id: "BOOK-1001",
      service: "Fan Installation & Repair",
      date: "28 September 2026",
      amount: 299,
      status: "Pending",
    },
    {
      id: "BOOK-0987",
      service: "Switch & Socket Repair",
      date: "20 September 2026",
      amount: 199,
      status: "Completed",
    },
    {
      id: "BOOK-0964",
      service: "Electrical Wiring",
      date: "14 September 2026",
      amount: 799,
      status: "Completed",
    },
    {
      id: "BOOK-0942",
      service: "Fan Installation & Repair",
      date: "08 September 2026",
      amount: 299,
      status: "Cancelled",
    },
  ];

  // ============================================
  // Status Style
  // ============================================

  const getStatusStyle = (value) => {
    const styles = {
      Active: "bg-green-100 text-green-700",
      Inactive: "bg-slate-100 text-slate-600",
      Pending: "bg-yellow-100 text-yellow-700",
      Blocked: "bg-red-100 text-red-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
    };

    return styles[value] || "bg-slate-100 text-slate-600";
  };

  // ============================================
  // Actions
  // ============================================

  const handleToggleStatus = () => {
    setStatus(status === "Active" ? "Inactive" : "Active");
  };

  const handleBlock = () => {
    setStatus("Blocked");
  };

  const handleDelete = () => {
    setShowDeleteModal(false);

    alert(`${user.name} has been deleted in demo mode.`);

    navigate("/admin/users");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ========================================
                HEADER
            ======================================== */}

      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="min-h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/users")}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                User Details
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {user.id}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() =>
                alert(
                  "Edit user functionality will be connected with backend later.",
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700"
            >
              <Edit size={17} />
              Edit User
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold"
            >
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* ========================================
                CONTENT
            ======================================== */}

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">
        {/* ====================================
                    PROFILE HEADER
                ==================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900"></div>

          <div className="px-5 sm:px-7 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div className="flex items-end gap-4 -mt-12">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-100 border-4 border-white shadow-lg text-blue-700 flex items-center justify-center text-3xl sm:text-4xl font-bold">
                  {user.avatar}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {user.name}
                    </h2>

                    {user.verified && (
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold">
                        <CheckCircle2 size={16} />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {user.role}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex sm:hidden gap-2">
                <button
                  onClick={() =>
                    alert(
                      "Edit user functionality will be connected with backend later.",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <Edit size={16} />
                  Edit
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================
                    MAIN GRID
                ==================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          {/* ==================================
                        LEFT CONTENT
                    ================================== */}

          <div className="xl:col-span-2 space-y-6">
            {/* Personal Information */}

            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Personal Information
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Basic account information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Full Name
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-2">
                    {user.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    User ID
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-2">
                    {user.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Email Address
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Mail size={15} className="text-slate-400" />

                    <p className="text-sm font-semibold text-slate-800 break-all">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Phone Number
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Phone size={15} className="text-slate-400" />

                    <p className="text-sm font-semibold text-slate-800">
                      {user.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Location
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <MapPin size={15} className="text-slate-400" />

                    <p className="text-sm font-semibold text-slate-800">
                      {user.location}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Account Role
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-2">
                    {user.role}
                  </p>
                </div>
              </div>
            </section>

            {/* Account Information */}

            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-purple-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Account Information
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Account status and verification
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={17} className="text-slate-500" />

                    <p className="text-xs text-slate-500">Joined Date</p>
                  </div>

                  <p className="font-semibold text-slate-800 mt-2">
                    {user.joined}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock3 size={17} className="text-slate-500" />

                    <p className="text-xs text-slate-500">Last Login</p>
                  </div>

                  <p className="font-semibold text-slate-800 mt-2">
                    {user.lastLogin}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <CheckCircle2 size={17} className="text-green-600" />
                    ) : (
                      <X size={17} className="text-red-600" />
                    )}

                    <p className="text-xs text-slate-500">Email Verification</p>
                  </div>

                  <p className="font-semibold text-slate-800 mt-2">
                    {user.emailVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {user.phoneVerified ? (
                      <CheckCircle2 size={17} className="text-green-600" />
                    ) : (
                      <X size={17} className="text-red-600" />
                    )}

                    <p className="text-xs text-slate-500">Phone Verification</p>
                  </div>

                  <p className="font-semibold text-slate-800 mt-2">
                    {user.phoneVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </div>
            </section>

            {/* Booking History */}

            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CalendarDays size={20} className="text-green-600" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Recent Bookings
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Latest booking activity
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 sm:px-6 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {booking.service}
                          </p>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                              booking.status,
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>{booking.id}</span>

                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {booking.date}
                          </span>
                        </div>
                      </div>

                      <p className="text-lg font-bold text-slate-900">
                        ₹{booking.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-slate-100">
                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All Bookings →
                </button>
              </div>
            </section>
          </div>

          {/* ==================================
                        RIGHT SIDEBAR
                    ================================== */}

          <div className="space-y-6">
            {/* Booking Statistics */}

            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CalendarDays size={20} className="text-blue-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Booking Statistics
                  </h3>

                  <p className="text-xs text-slate-500">User activity</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Bookings</span>

                  <span className="font-bold text-slate-900">
                    {user.bookings}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Completed</span>

                  <span className="font-bold text-green-600">
                    {user.completedBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Pending</span>

                  <span className="font-bold text-yellow-600">
                    {user.pendingBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Cancelled</span>

                  <span className="font-bold text-red-600">
                    {user.cancelledBookings}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        user.bookings
                          ? (user.completedBookings / user.bookings) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  {user.completedBookings} of {user.bookings} bookings completed
                </p>
              </div>
            </section>

            {/* Account Actions */}

            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <UserCheck size={20} className="text-orange-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Account Actions</h3>

                  <p className="text-xs text-slate-500">Manage this account</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleToggleStatus}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-3">
                    {status === "Active" ? (
                      <X size={17} />
                    ) : (
                      <CheckCircle2 size={17} />
                    )}

                    {status === "Active"
                      ? "Deactivate Account"
                      : "Activate Account"}
                  </span>
                </button>

                <button
                  onClick={handleBlock}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-orange-200 hover:bg-orange-50 rounded-xl text-sm font-semibold text-orange-600"
                >
                  <span className="flex items-center gap-3">
                    <Ban size={17} />
                    Block Account
                  </span>
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-red-200 hover:bg-red-50 rounded-xl text-sm font-semibold text-red-600"
                >
                  <span className="flex items-center gap-3">
                    <Trash2 size={17} />
                    Delete Account
                  </span>
                </button>
              </div>
            </section>

            {/* Quick Info */}

            <section className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users size={20} />
                </div>

                <div>
                  <h3 className="font-bold">User Account</h3>

                  <p className="text-xs text-slate-400">FIXNEAR platform</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">User ID</span>

                  <span className="font-medium">{user.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Role</span>

                  <span className="font-medium">{user.role}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>

                  <span className="font-medium">{status}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ========================================
                DELETE MODAL
            ======================================== */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={22} className="text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-5">
              Delete User?
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-800">{user.name}</span>?
              This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;
