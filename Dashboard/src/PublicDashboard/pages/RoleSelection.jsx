// import { Link } from "react-router-dom";
// import {
//   UserRound,
//   Wrench,
//   ShieldCheck,
//   ArrowRight,
//   UserPlus,
// } from "lucide-react";

// function RoleSelection() {
//   const roles = [
//     {
//       title: "Customer",
//       description:
//         "Find trusted local professionals, book services and manage your appointments.",
//       icon: UserRound,
//       login: "/login",
//       register: "/register",
//       color: "blue",
//     },
//     {
//       title: "Service Provider",
//       description:
//         "Offer your services, receive bookings and grow your local service business.",
//       icon: Wrench,
//       login: "/provider/login",
//       register: "/provider/register",
//       color: "emerald",
//     },
//     {
//       title: "Admin",
//       description:
//         "Manage users, providers, services, bookings and the FIXNEAR platform.",
//       icon: ShieldCheck,
//       login: "/admin/login",
//       register: null,
//       color: "slate",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 py-16">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

//         {/* Header */}
//         <div className="text-center max-w-2xl mx-auto">
//           <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
//             FIXNEAR Access
//           </span>

//           <h1 className="mt-5 text-4xl sm:text-5xl font-black text-slate-900">
//             Choose your{" "}
//             <span className="text-blue-600">FIXNEAR panel</span>
//           </h1>

//           <p className="mt-4 text-slate-500 text-lg">
//             Select how you want to use the FIXNEAR platform.
//           </p>
//         </div>

//         {/* Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

//           {roles.map((role) => {
//             const Icon = role.icon;

//             return (
//               <div
//                 key={role.title}
//                 className="group bg-white border border-slate-200 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
//               >
//                 {/* Icon */}
//                 <div
//                   className={`w-16 h-16 rounded-2xl flex items-center justify-center
//                   ${
//                     role.color === "blue"
//                       ? "bg-blue-100 text-blue-600"
//                       : role.color === "emerald"
//                       ? "bg-emerald-100 text-emerald-600"
//                       : "bg-slate-100 text-slate-700"
//                   }`}
//                 >
//                   <Icon size={30} />
//                 </div>

//                 {/* Content */}
//                 <h2 className="text-2xl font-bold text-slate-900 mt-6">
//                   {role.title}
//                 </h2>

//                 <p className="text-slate-500 leading-7 mt-3 min-h-21">
//                   {role.description}
//                 </p>

//                 {/* Login */}
//                 <Link
//                   to={role.login}
//                   className="mt-7 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition"
//                 >
//                   Login
//                   <ArrowRight size={18} />
//                 </Link>

//                 {/* Register */}
//                 {role.register && (
//                   <Link
//                     to={role.register}
//                     className="mt-3 w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-600 py-3.5 rounded-xl font-semibold transition"
//                   >
//                     <UserPlus size={18} />
//                     {role.title === "Customer"
//                       ? "Create Account"
//                       : "Become a Provider"}
//                   </Link>
//                 )}

//                 {!role.register && (
//                   <p className="text-center text-xs text-slate-400 mt-4">
//                     Admin accounts are managed securely by FIXNEAR.
//                   </p>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RoleSelection;