import BookingChat from "./BookingChat";
import { X, MessageCircle } from "lucide-react";

export default function BookingMessagePopup({
  open,
  onClose,
  bookingId,
  currentUserId,
  otherPersonName = "Contact",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${otherPersonName}`}
        className="flex h-[85vh] max-h-[700px] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-blue-600" size={24} />

            <div>
              <h2 className="font-bold text-slate-900">
                Message {otherPersonName}
              </h2>
              <p className="text-xs text-slate-500">Booking conversation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close messages"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <BookingChat bookingId={bookingId} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
