import {
    X,
} from "lucide-react";

function Modal({
    isOpen,
    onClose,
    title,
    children,
}) {

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4">

            {/* BACKDROP */}

            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* MODAL */}

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">

                    <h2 className="text-lg font-bold text-slate-900">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* CONTENT */}

                <div className="p-6">
                    {children}
                </div>

            </div>

        </div>
    );
}

export default Modal;