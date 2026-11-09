import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  PanelLeftOpen,
  XCircle,
  RefreshCw,
} from "lucide-react";

import API from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  const [admin, setAdmin] = useState({});

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const savedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");

      setAdmin(savedAdmin);
    } catch (error) {
      console.error("Admin data error:", error);
      setAdmin({});
    }
  }, [navigate]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
  };

  // =========================================================
  // UNAUTHORIZED HANDLER
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
  };

  // =========================================================
  // API ERROR HANDLER
  // =========================================================

  const handleApiError = (error) => {
    console.error("Admin Dashboard API Error:", error);

    if (error?.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    if (error?.response?.status === 403) {
      alert(
        error?.response?.data?.message ||
          "You are not authorized to access this data.",
      );
      return;
    }

    alert(
      error?.response?.data?.message ||
        "Something went wrong while loading dashboard data.",
    );
  };

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  const fetchDashboardData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setDashboardError("");

      const results = await Promise.allSettled([
        API.get("/admin/dashboard"),
        API.get("/bookings"),
        API.get("/admin/users"),
        API.get("/admin/providers"),
        API.get("/services/admin/all"),
        API.get("/complaints"),
      ]);

      let successfulRequests = 0;

      // -----------------------------------------------------
      // DASHBOARD STATS
      // -----------------------------------------------------

      if (results[0].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[0].value?.data;

        if (data?.success !== false) {
          setDashboardStats(data?.stats || data?.dashboard || data || {});
        }
      } else if (results[0].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      // -----------------------------------------------------
      // BOOKINGS
      // -----------------------------------------------------

      if (results[1].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[1].value?.data;
        const bookingData = data?.bookings || data?.data || [];

        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } else if (results[1].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      // -----------------------------------------------------
      // USERS
      // -----------------------------------------------------

      if (results[2].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[2].value?.data;
        const userData = data?.users || data?.data || [];

        setUsers(Array.isArray(userData) ? userData : []);
      } else if (results[2].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      // -----------------------------------------------------
      // PROVIDERS
      // -----------------------------------------------------

      if (results[3].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[3].value?.data;
        const providerData = data?.providers || data?.data || [];

        setProviders(Array.isArray(providerData) ? providerData : []);
      } else if (results[3].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      // -----------------------------------------------------
      // SERVICES
      // -----------------------------------------------------

      if (results[4].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[4].value?.data;
        const serviceData = data?.services || data?.data || [];

        setServices(Array.isArray(serviceData) ? serviceData : []);
      } else if (results[4].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      // -----------------------------------------------------
      // COMPLAINTS
      // -----------------------------------------------------

      if (results[5].status === "fulfilled") {
        successfulRequests += 1;
        const data = results[5].value?.data;
        const complaintData = data?.complaints || data?.data || [];

        setComplaints(Array.isArray(complaintData) ? complaintData : []);
      } else if (results[5].reason?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (successfulRequests === 0) {
        setDashboardError(
          "Unable to load dashboard data. Please check the server and try again.",
        );
      } else if (successfulRequests < 5) {
        setDashboardError(
          "Some dashboard sections could not be loaded. You can refresh to try again.",
        );
      }
    } catch (error) {
      console.error("Admin Dashboard API Error:", error);

      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setDashboardError(
        error?.response?.data?.message ||
          "Something went wrong while loading dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) return;

    fetchDashboardData();
  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // =========================================================
  // NORMALIZED DASHBOARD STATS
  // =========================================================

  const normalizedStats = useMemo(() => {
    const stats = dashboardStats || {};

    const normalizedStatus = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");

    const bookingCount = (statuses) =>
      bookings.filter((booking) =>
        statuses.includes(normalizedStatus(booking?.status)),
      ).length;

    const totalBookings =
      stats.totalBookings ??
      stats.bookingsCount ??
      (Number.isFinite(Number(stats.bookings))
        ? Number(stats.bookings)
        : null) ??
      bookings.length;

    const completedBookings =
      stats.completedBookings ??
      stats.completedBookingCount ??
      bookingCount(["completed"]);

    const cancelledBookings =
      stats.cancelledBookings ??
      stats.cancelledBookingCount ??
      bookingCount(["cancelled", "rejected"]);

    const openComplaints =
      stats.openComplaints ??
      stats.pendingComplaints ??
      stats.complaintsCount ??
      complaints.filter((complaint) =>
        ["open", "in-progress"].includes(normalizedStatus(complaint?.status)),
      ).length;

    const totalRevenueFromBookings = bookings.reduce((total, booking) => {
      const status = normalizedStatus(booking?.status);
      const amount = Number(booking?.price ?? booking?.amount ?? 0);

      if (["cancelled", "rejected"].includes(status)) {
        return total;
      }

      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const todayBookingsFallback = bookings.filter((booking) => {
      const date = new Date(booking?.bookingDate || booking?.createdAt || "");

      return (
        !Number.isNaN(date.getTime()) &&
        date >= startOfToday &&
        date < endOfToday
      );
    }).length;

    const pendingProvidersFallback = providers.filter((provider) => {
      const verificationStatus = String(
        provider?.verificationStatus ||
          provider?.status ||
          provider?.applicationStatus ||
          "",
      )
        .trim()
        .toLowerCase();

      if (["approved", "verified", "active"].includes(verificationStatus)) {
        return false;
      }

      if (
        ["pending", "submitted", "under-review", "under review"].includes(
          verificationStatus,
        )
      ) {
        return provider?.user?.isActive !== false;
      }

      return (
        provider?.isVerified !== true && provider?.user?.isActive !== false
      );
    }).length;

    return {
      totalUsers:
        stats.totalUsers ??
        stats.usersCount ??
        (Number.isFinite(Number(stats.users)) ? Number(stats.users) : null) ??
        users.length,

      totalProviders:
        stats.totalProviders ??
        stats.providersCount ??
        (Number.isFinite(Number(stats.providers))
          ? Number(stats.providers)
          : null) ??
        providers.length,

      totalServices:
        stats.totalServices ??
        stats.servicesCount ??
        (Number.isFinite(Number(stats.services))
          ? Number(stats.services)
          : null) ??
        services.length,

      activeServices:
        stats.activeServices ??
        services.filter((service) => service?.isActive !== false).length,

      totalBookings,

      completedBookings,

      cancelledBookings,

      totalRevenue:
        stats.totalRevenue ?? stats.revenue ?? totalRevenueFromBookings,

      todayBookings:
        stats.todayBookings ?? stats.todayBookingCount ?? todayBookingsFallback,

      pendingProviders:
        stats.pendingProviders ??
        stats.pendingProviderApplications ??
        pendingProvidersFallback,

      pendingComplaints: openComplaints,

      openComplaints,
    };
  }, [dashboardStats, users, providers, bookings, services, complaints]);

  // =========================================================
  // BOOKING STATUS DATA
  // =========================================================

  const bookingStatus = useMemo(() => {
    const getCount = (statuses) => {
      return bookings.filter((booking) =>
        statuses.includes(String(booking?.status || "").toLowerCase()),
      ).length;
    };

    const total = bookings.length > 0 ? bookings.length : 1;

    const createItem = (name, statuses, Icon, iconColor, bg) => {
      const count = getCount(statuses);

      return {
        name,
        count,
        percentage: Math.round((count / total) * 100),
        icon: Icon,
        iconColor,
        bg,
      };
    };

    return [
      createItem(
        "Pending",
        ["pending"],
        Clock,
        "text-yellow-600",
        "bg-yellow-50",
      ),

      createItem(
        "Accepted",
        ["accepted", "confirmed"],
        CheckCircle2,
        "text-blue-600",
        "bg-blue-50",
      ),

      createItem(
        "In Progress",
        ["in-progress", "in progress"],
        Wrench,
        "text-orange-600",
        "bg-orange-50",
      ),

      createItem(
        "Completed",
        ["completed"],
        CheckCircle2,
        "text-green-600",
        "bg-green-50",
      ),

      createItem(
        "Cancelled",
        ["cancelled", "rejected"],
        XCircle,
        "text-red-600",
        "bg-red-50",
      ),
    ];
  }, [bookings]);

  // =========================================================
  // MONTHLY REVENUE
  // =========================================================

  const monthlyRevenue = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const now = new Date();
    const currentYear = now.getFullYear();

    const revenueMap = {};

    months.forEach((month) => {
      revenueMap[month] = 0;
    });

    bookings.forEach((booking) => {
      const bookingDate = new Date(booking?.bookingDate || booking?.createdAt);

      if (Number.isNaN(bookingDate.getTime())) return;

      if (bookingDate.getFullYear() !== currentYear) {
        return;
      }

      const month = months[bookingDate.getMonth()];

      const amount = Number(booking?.price || booking?.amount || 0);

      revenueMap[month] += amount;
    });

    const lastSixMonths = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i, 1);

      const month = months[date.getMonth()];

      lastSixMonths.push({
        month,
        revenue: revenueMap[month] || 0,
      });
    }

    return lastSixMonths;
  }, [bookings]);

  // =========================================================
  // RECENT BOOKINGS
  // =========================================================

  const recentBookings = useMemo(() => {
    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    const sorted = [...bookings].sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.bookingDate || 0).getTime();
      const dateB = new Date(b?.createdAt || b?.bookingDate || 0).getTime();
      return dateB - dateA;
    });

    return sorted.slice(0, 10).map((booking) => {
      const customer =
        booking?.customer?.name || booking?.customer?.email || "Customer";
      const provider =
        booking?.provider?.user?.name ||
        booking?.provider?.businessName ||
        booking?.provider?.name ||
        "Provider";
      const service =
        booking?.service?.name || booking?.service?.title || "Service";
      const date = booking?.bookingDate
        ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : booking?.createdAt
          ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";

      const rawStatus = booking?.status || "pending";
      const status = normalize(rawStatus);
      const paymentMethod = normalize(
        booking?.paymentMethod ||
          booking?.payment?.method ||
          booking?.paymentType ||
          booking?.payment_mode ||
          "unknown",
      );
      const paymentStatus = normalize(
        booking?.paymentStatus ||
          booking?.payment?.status ||
          booking?.razorpayPaymentStatus ||
          booking?.payment_state ||
          "",
      );
      const isOnline = [
        "online",
        "razorpay",
        "card",
        "upi",
        "netbanking",
        "payonline",
      ].includes(paymentMethod);
      const isCash = [
        "cash",
        "cod",
        "cashonservice",
        "cashondelivery",
        "paylater",
      ].includes(paymentMethod);
      const failedStatuses = [
        "paymentfailed",
        "failed",
        "cancelled",
        "canceled",
        "rejected",
        "paymentcancelled",
        "paymentcanceled",
      ];
      const paidStatuses = [
        "paid",
        "success",
        "successful",
        "captured",
        "verified",
        "completed",
      ];
      const isCancelled = failedStatuses.includes(status);
      const isPaid =
        paidStatuses.includes(paymentStatus) ||
        booking?.payment?.verified === true ||
        booking?.isPaymentVerified === true ||
        booking?.paymentVerified === true;
      const isPaymentFailed =
        failedStatuses.includes(paymentStatus) ||
        ["paymentfailed", "paymentcancelled", "paymentcanceled"].includes(
          status,
        );

      let bookingResult = "Booking Placed";
      let bookingResultStyle = "bg-green-100 text-green-700";
      if (isCancelled || isPaymentFailed) {
        bookingResult = "Not Successful";
        bookingResultStyle = "bg-red-100 text-red-700";
      } else if (isOnline && !isPaid) {
        bookingResult =
          paymentStatus === "pending" || status === "pendingpayment"
            ? "Payment Pending"
            : "Not Successful";
        bookingResultStyle =
          bookingResult === "Payment Pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700";
      }

      let paymentMethodLabel = isOnline
        ? "Online"
        : isCash
          ? "Cash"
          : paymentMethod === "unknown"
            ? "Not specified"
            : paymentMethod;
      let paymentLabel = isPaid
        ? "Paid"
        : isPaymentFailed
          ? "Failed"
          : isOnline
            ? bookingResult === "Payment Pending"
              ? "Pending"
              : "Not paid"
            : isCash
              ? "Pay after service"
              : "Unknown";
      let paymentStyle = isPaid
        ? "bg-green-100 text-green-700"
        : isPaymentFailed || (isOnline && bookingResult === "Not Successful")
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

      return {
        id: booking?._id || booking?.id || "N/A",
        customer,
        service,
        provider,
        date,
        amount: booking?.price ?? booking?.amount ?? 0,
        status: rawStatus,
        bookingResult,
        bookingResultStyle,
        paymentMethodLabel,
        paymentLabel,
        paymentStyle,
      };
    });
  }, [bookings]);

  // =========================================================
  // RECENT USERS
  // =========================================================

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();

        const dateB = new Date(b?.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5)
      .map((user) => ({
        id: user?._id || user?.id,
        name: user?.name || "Unknown User",
        email: user?.email || "",
        role: user?.role === "provider" ? "Provider" : "Customer",
        date: user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
      }));
  }, [users]);

  // =========================================================
  // PENDING PROVIDERS
  // =========================================================

  const pendingProviders = useMemo(() => {
    return providers
      .filter((provider) => {
        const verificationStatus = String(
          provider?.verificationStatus ||
            provider?.status ||
            provider?.applicationStatus ||
            "",
        )
          .trim()
          .toLowerCase();

        if (["approved", "verified", "active"].includes(verificationStatus)) {
          return false;
        }

        if (
          ["pending", "submitted", "under-review", "under review"].includes(
            verificationStatus,
          )
        ) {
          return provider?.user?.isActive !== false;
        }

        return (
          provider?.isVerified !== true && provider?.user?.isActive !== false
        );
      })
      .slice(0, 5)
      .map((provider) => ({
        id: provider?._id,
        name: provider?.user?.name || provider?.businessName || "Provider",

        service: provider?.businessName || "Service Provider",

        location: provider?.city || provider?.state || "Location not available",

        applied: provider?.createdAt
          ? new Date(provider.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
      }));
  }, [providers]);

  // =========================================================
  // RECENT COMPLAINTS
  // =========================================================

  const recentComplaints = useMemo(() => {
    return [...complaints]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5)
      .map((complaint) => ({
        id: complaint?._id || complaint?.id,
        subject: complaint?.subject || "Complaint",
        customer:
          complaint?.customer?.name || complaint?.customer?.email || "Customer",
        category: complaint?.category || "other",
        status: complaint?.status || "open",
        date: complaint?.createdAt
          ? new Date(complaint.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
      }));
  }, [complaints]);

  // =========================================================
  // SEARCH BOOKINGS
  // =========================================================

  const filteredBookings = useMemo(() => {
    if (!search.trim()) {
      return recentBookings;
    }

    const value = search.toLowerCase();

    return recentBookings.filter(
      (booking) =>
        booking.id.toLowerCase().includes(value) ||
        booking.customer.toLowerCase().includes(value) ||
        booking.service.toLowerCase().includes(value) ||
        booking.provider.toLowerCase().includes(value),
    );
  }, [search, recentBookings]);

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toLowerCase();

    const styles = {
      pending: "bg-yellow-100 text-yellow-700",

      accepted: "bg-blue-100 text-blue-700",

      confirmed: "bg-blue-100 text-blue-700",

      "in-progress": "bg-orange-100 text-orange-700",

      completed: "bg-green-100 text-green-700",

      cancelled: "bg-red-100 text-red-700",

      rejected: "bg-red-100 text-red-700",
    };

    return styles[normalized] || "bg-slate-100 text-slate-700";
  };

  // =========================================================
  // MAIN STAT CARDS
  // =========================================================

  const stats = [
    {
      title: "Total Users",
      value: normalizedStats.totalUsers,
      description: "Registered customers and users",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Providers",
      value: normalizedStats.totalProviders,
      description: "Registered service providers",
      icon: UserCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Total Services",
      value: normalizedStats.totalServices,
      description: "Services available on FIXNEAR",
      icon: Wrench,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      title: "Total Bookings",
      value: normalizedStats.totalBookings,
      description: "All platform bookings",
      icon: CalendarDays,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Completed Bookings",
      value: normalizedStats.completedBookings,
      description: "Successfully completed bookings",
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Cancelled Bookings",
      value: normalizedStats.cancelledBookings,
      description: "Cancelled or rejected bookings",
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Open Complaints",
      value: normalizedStats.openComplaints,
      description: "Complaints needing attention",
      icon: AlertTriangle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(normalizedStats.totalRevenue || 0).toLocaleString(
        "en-IN",
      )}`,
      description: "Based on non-cancelled bookings",
      icon: IndianRupee,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  // =========================================================
  // TODAY STATS
  // =========================================================

  const todayStats = [
    {
      title: "Today's Bookings",
      value: normalizedStats.todayBookings,
      icon: CalendarDays,
      iconColor: "text-blue-600",
    },

    {
      title: "Pending Verification",
      value: normalizedStats.pendingProviders,
      icon: ShieldCheck,
      iconColor: "text-orange-600",
    },

    {
      title: "Open Complaints",
      value: normalizedStats.pendingComplaints,
      icon: AlertTriangle,
      iconColor: "text-red-600",
    },

    {
      title: "Active Services",
      value: normalizedStats.activeServices,
      icon: Wrench,
      iconColor: "text-green-600",
    },
  ];

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const quickActions = [
    {
      title: "Manage Users",
      description: "View and manage customers",
      icon: Users,
      path: "/admin/users",
    },

    {
      title: "Verify Providers",
      description: "Review provider applications",
      icon: ShieldCheck,
      path: "/admin/providers",
    },

    {
      title: "Manage Services",
      description: "Add or edit services",
      icon: Wrench,
      path: "/admin/services",
    },

    {
      title: "Manage Bookings",
      description: "Monitor all bookings",
      icon: CalendarDays,
      path: "/admin/bookings",
    },

    {
      title: "Complaints",
      description: "Review customer complaints",
      icon: MessageSquare,
      path: "/admin/complaints",
    },

    {
      title: "Notifications",
      description: "Manage admin notifications",
      icon: Bell,
      path: "/admin/notifications",
    },
  ];

  // =========================================================
  // SIDEBAR
  // =========================================================

  const sidebarItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },

    {
      label: "Users",
      icon: Users,
      path: "/admin/users",
    },

    {
      label: "Providers",
      icon: UserCheck,
      path: "/admin/providers",
    },

    {
      label: "Services",
      icon: Wrench,
      path: "/admin/services",
    },

    {
      label: "Bookings",
      icon: CalendarDays,
      path: "/admin/bookings",
    },
    {
      label: "Category",
      icon: PanelLeftOpen,
      path: "/admin/categories",
    },

    {
      label: "Complaints",
      icon: AlertTriangle,
      path: "/admin/complaints",
    },

    {
      label: "Notifications",
      icon: Bell,
      path: "/admin/notifications",
    },

    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-600">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-slate-950 text-white transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}

          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold">FIXNEAR</h1>

              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-3">
              Main Menu
            </p>

            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.path === "/admin/dashboard"
                    ? currentPath === "/admin/dashboard"
                    : currentPath === item.path ||
                      currentPath.startsWith(`${item.path}/`);

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />

                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Admin Profile */}

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {admin?.name || "Admin"}
                </p>

                <p className="text-xs text-slate-400 truncate">
                  {admin?.email || "admin@fixnear.com"}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="lg:ml-72">
        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu size={22} />
              </button>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Admin Dashboard
                </h2>

                <p className="hidden sm:block text-sm text-slate-500 mt-1">
                  Monitor and manage your FIXNEAR platform.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}

              <div className="hidden md:block relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bookings..."
                  className="w-64 pl-9 pr-4 py-2.5 bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none text-sm"
                />
              </div>

              {/* Refresh */}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                title="Refresh dashboard"
              >
                <RefreshCw
                  size={20}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>

              {/* Notification */}

              <button
                onClick={() => navigate("/admin/notifications")}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600"
              >
                <Bell size={21} />

                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile */}

              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>

                <div className="hidden xl:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {admin?.name || "Admin"}
                  </p>

                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="p-4 sm:p-6 lg:p-8">
          {dashboardError && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    Dashboard data warning
                  </p>
                  <p className="text-sm mt-1">{dashboardError}</p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-200 hover:bg-amber-100 text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Retry
              </button>
            </div>
          )}

          {/* Welcome */}

          <div className="mb-7">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Welcome back, {admin?.name || "Admin"} 👋
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Here is what's happening on FIXNEAR today.
            </p>
          </div>

          {/* =================================================
              MAIN STAT CARDS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
                    >
                      <Icon size={23} className={stat.iconColor} />
                    </div>

                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                      <ArrowUpRight size={14} />
                      Live
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mt-5">{stat.title}</p>

                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.value}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* =================================================
              TODAY STATS
          ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {todayStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon size={19} className={stat.iconColor} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">{stat.title}</p>

                    <p className="text-xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =================================================
              BOOKING STATUS + REVENUE
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-7">
            {/* Booking Status */}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Booking Overview</h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Current booking status
                  </p>
                </div>

                <CalendarDays size={20} className="text-slate-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {bookingStatus.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.name}
                      className={`${item.bg} rounded-xl p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={18} className={item.iconColor} />

                        <span className="text-lg font-bold text-slate-900">
                          {item.count}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3">{item.name}</p>

                      <div className="mt-2 h-1.5 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue */}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Revenue Overview</h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Revenue from available bookings
                  </p>
                </div>

                <IndianRupee size={20} className="text-slate-400" />
              </div>

              {monthlyRevenue.some((item) => item.revenue > 0) ? (
                <div className="h-56 flex items-end justify-between gap-3 px-2">
                  {monthlyRevenue.map((item) => {
                    const maxRevenue = Math.max(
                      ...monthlyRevenue.map((x) => x.revenue),
                      1,
                    );

                    const height = (item.revenue / maxRevenue) * 100;

                    return (
                      <div
                        key={item.month}
                        className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                      >
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          ₹{Math.round(item.revenue / 1000)}k
                        </span>

                        <div className="w-full max-w-10 h-full max-h-36 bg-slate-100 rounded-t-lg overflow-hidden flex items-end">
                          <div
                            className="w-full bg-blue-600 rounded-t-lg transition-all"
                            style={{
                              height: `${Math.max(height, 3)}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-medium text-slate-500">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-center">
                  <div>
                    <IndianRupee size={35} className="mx-auto text-slate-300" />

                    <p className="text-sm text-slate-500 mt-3">
                      No booking revenue data available yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              RECENT BOOKINGS
          ================================================= */}

          <div className="bg-white border border-slate-200 rounded-2xl mb-7">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Recent Bookings</h3>

                <p className="text-sm text-slate-500 mt-1">
                  Latest activity on the platform
                </p>
              </div>

              <button
                onClick={() => navigate("/admin/bookings")}
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight size={16} />
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarDays size={40} className="mx-auto text-slate-300" />

                <p className="text-sm text-slate-500 mt-3">
                  No bookings found.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop */}

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Booking
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Customer
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Service
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Provider
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Amount
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Booking Result
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Payment
                        </th>

                        <th className="px-6 py-4" />
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-slate-900">
                              {String(booking.id).slice(-8)}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {booking.date}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-800">
                              {booking.customer}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600 max-w-44 truncate">
                              {booking.service}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {booking.provider}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              ₹{Number(booking.amount).toLocaleString("en-IN")}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${booking.bookingResultStyle}`}
                              >
                                {booking.bookingResult}
                              </span>
                              <span className="text-[11px] text-slate-500 capitalize">
                                Status: {booking.status}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-sm font-semibold text-slate-700">
                                {booking.paymentMethodLabel}
                              </span>
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${booking.paymentStyle}`}
                              >
                                {booking.paymentLabel}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                navigate(`/admin/bookings/${booking.id}`)
                              }
                              className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                              <MoreVertical
                                size={18}
                                className="text-slate-500"
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}

                <div className="md:hidden divide-y divide-slate-100">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            {String(booking.id).slice(-8)}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {booking.date}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.bookingResultStyle}`}
                        >
                          {booking.bookingResult}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p>
                          <span className="text-slate-500">Customer: </span>

                          <span className="font-medium">
                            {booking.customer}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">Service: </span>

                          <span className="font-medium">{booking.service}</span>
                        </p>

                        <p>
                          <span className="text-slate-500">Provider: </span>

                          <span className="font-medium">
                            {booking.provider}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">Amount: </span>

                          <span className="font-bold">
                            ₹{Number(booking.amount).toLocaleString("en-IN")}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Payment Method:{" "}
                          </span>
                          <span className="font-medium">
                            {booking.paymentMethodLabel}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Payment Status:{" "}
                          </span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${booking.paymentStyle}`}
                          >
                            {booking.paymentLabel}
                          </span>
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Booking Status:{" "}
                          </span>
                          <span className="font-medium capitalize">
                            {booking.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="sm:hidden p-4 border-t border-slate-100">
              <button
                onClick={() => navigate("/admin/bookings")}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700"
              >
                View All Bookings
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* =================================================
              USERS + PROVIDERS
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-7">
            {/* Recent Users */}

            <div className="bg-white border border-slate-200 rounded-2xl">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Recent Users</h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Recently registered users
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/users")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No users found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {user.name}
                        </p>

                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.role === "Provider"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role}
                        </span>

                        <p className="text-[11px] text-slate-400 mt-1">
                          {user.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Provider Verification */}

            <div className="bg-white border border-slate-200 rounded-2xl">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Pending Provider Verification
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Providers waiting for approval
                  </p>
                </div>

                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                  {normalizedStats.pendingProviders} Pending
                </span>
              </div>

              {pendingProviders.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={35} className="mx-auto text-green-500" />

                  <p className="text-sm text-slate-500 mt-3">
                    No pending provider verification.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {pendingProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-4 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                          <UserCheck size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {provider.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {provider.service} • {provider.location}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-1">
                            Applied {provider.applied}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            navigate(`/admin/providers/${provider.id}`)
                          }
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="p-4">
                <button
                  onClick={() => navigate("/admin/providers")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700"
                >
                  View All Providers
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* =================================================
              COMPLAINTS
          ================================================= */}

          <div className="bg-white border border-slate-200 rounded-2xl mb-7">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Complaints</h3>

                <p className="text-sm text-slate-500 mt-1">
                  Customer issues requiring attention
                </p>
              </div>

              <button
                onClick={() => navigate("/admin/complaints")}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600"
              >
                Manage
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <MessageSquare size={23} className="text-red-600" />
                </div>

                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {normalizedStats.pendingComplaints}
                  </p>

                  <p className="text-sm text-slate-500">Pending complaints</p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              RECENT COMPLAINTS
          ================================================= */}

          <div className="bg-white border border-slate-200 rounded-2xl mb-7">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Recent Complaints</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Latest customer issues submitted on the platform
                </p>
              </div>

              <button
                onClick={() => navigate("/admin/complaints")}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage
                <ArrowRight size={16} />
              </button>
            </div>

            {recentComplaints.length === 0 ? (
              <div className="p-10 text-center">
                <MessageSquare size={38} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-500 mt-3">
                  No complaints found.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Complaint
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>

                    <tbody>
                      {recentComplaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-slate-900 max-w-64 truncate">
                              {complaint.subject}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">
                              {complaint.customer}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="capitalize text-sm text-slate-600">
                              {complaint.category}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">
                              {complaint.date}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                                complaint.status,
                              )}`}
                            >
                              {complaint.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                navigate(`/admin/complaints/${complaint.id}`)
                              }
                              className="p-2 hover:bg-slate-100 rounded-lg"
                              title="View complaint"
                            >
                              <ArrowRight
                                size={17}
                                className="text-slate-500"
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                  {recentComplaints.map((complaint) => (
                    <button
                      key={complaint.id}
                      onClick={() =>
                        navigate(`/admin/complaints/${complaint.id}`)
                      }
                      className="w-full text-left p-5 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {complaint.subject}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {complaint.customer}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                            complaint.status,
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                        <span className="capitalize">{complaint.category}</span>
                        <span>{complaint.date}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div>
            <div className="mb-4">
              <h3 className="font-bold text-slate-900">Quick Actions</h3>

              <p className="text-sm text-slate-500 mt-1">
                Quickly access important admin sections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition">
                        <Icon
                          size={21}
                          className="text-slate-600 group-hover:text-blue-600"
                        />
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-slate-400 group-hover:text-blue-600 transition"
                      />
                    </div>

                    <h4 className="font-semibold text-slate-900 mt-4">
                      {action.title}
                    </h4>

                    <p className="text-sm text-slate-500 mt-1">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
