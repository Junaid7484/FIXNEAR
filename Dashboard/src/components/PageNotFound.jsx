import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4">

            <div className="text-center max-w-lg">

                <div className="text-8xl font-black text-blue-600">
                    404
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mt-5">
                    Page Not Found
                </h1>

                <p className="text-slate-500 mt-3">
                    The page you are looking for
                    doesn't exist or may have been
                    moved.
                </p>

                <Link
                    to="/"
                    className="inline-block mt-7 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
                >
                    Back to Home
                </Link>

            </div>

        </div>
    );
}

export default NotFound;