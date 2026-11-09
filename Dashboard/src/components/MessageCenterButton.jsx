import { useState } from "react";
import { MessageCircle } from "lucide-react";
import MessageCenterPopup from "./BookingMessagePopup";

export default function MessageCenterButton({
  bookings = [],
  currentUserId,
  initialBookingId = "",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 ${className}`}
      >
        <MessageCircle size={19} />
        <span>Message Center</span>
      </button>

      <MessageCenterPopup
        open={isOpen}
        onClose={() => setIsOpen(false)}
        bookings={bookings}
        currentUserId={currentUserId}
        initialBookingId={initialBookingId}
      />
    </>
  );
}
