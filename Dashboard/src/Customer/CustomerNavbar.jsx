import { Link } from "react-router-dom";
import { Bell, User, Wrench } from "lucide-react";

const CustomerNavbar = ({ user }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-full flex items-center">
        {/* ===================================================
            LEFT SECTION - LOGO
        ==================================================== */}
        <div className="flex items-center min-w-[255px] h-full px-4 sm:px-6 lg:px-8 border-r border-slate-300">
          <Link to="/customer/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                FIXNEAR
              </h1>

              <p className="text-xs font-medium text-slate-500">
                Customer Panel
              </p>
            </div>
          </Link>
        </div>

        {/* ===================================================
            CENTER SECTION - PAGE TITLE
        ==================================================== */}
        <div className="hidden md:flex flex-1 justify-start ml-10">
          <div className="text-start">
            <h2 className="text-lg font-semibold text-slate-900">
              Customer Dashboard
            </h2>

            <p className="text-sm text-slate-500">
              Manage your FIXNEAR services
            </p>
          </div>
        </div>

        {/* ===================================================
            RIGHT SECTION
        ==================================================== */}
        <div className="flex items-center justify-end gap-3 min-w-[220px] px-4 sm:px-6 lg:px-8">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Link>

          {/* Vertical Divider */}
          <div className="hidden sm:block h-8 w-px bg-slate-200" />

          {/* User Profile */}
          <Link
            to="/profile"
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || "Customer"}
              </p>

              <p className="text-xs text-slate-500">Customer</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default CustomerNavbar;
