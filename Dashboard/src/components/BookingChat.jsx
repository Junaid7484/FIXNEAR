import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";

const CHAT_POLL_INTERVAL = 8000;
const CHAT_PAGE_SIZE = 50;

const mergeMessages = (current, incoming, prepend = false) => {
  const byId = new Map(current.map((item) => [String(item._id), item]));
  incoming.forEach((item) => byId.set(String(item._id), item));
  const merged = Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a._id).localeCompare(String(b._id));
  });
  return prepend ? merged : merged;
};

const BookingChat = ({ bookingId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const messageListRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const latestMessageIdRef = useRef(null);
  const pendingOlderScrollRef = useRef(null);
  const previousLastMessageIdRef = useRef(null);

  const fetchMessages = useCallback(
    async ({ mode = "latest", signal } = {}) => {
      if (!bookingId || requestInFlightRef.current) return null;

      const currentMessages = messagesRef.current;
      const params = { limit: CHAT_PAGE_SIZE };
      if (mode === "older") {
        const oldestId = currentMessages[0]?._id;
        if (!oldestId) return null;
        params.before = oldestId;
      } else if (mode === "after") {
        const newestId = latestMessageIdRef.current;
        if (!newestId) return null;
        params.after = newestId;
      }

      requestInFlightRef.current = true;
      try {
        const response = await API.get(`/bookings/${bookingId}/messages`, {
          params,
          signal,
        });
        const incoming = response.data.messages || [];

        if (mode === "older") {
          const list = messageListRef.current;
          if (list) {
            pendingOlderScrollRef.current = {
              height: list.scrollHeight,
              top: list.scrollTop,
            };
          }
          setMessages((previous) => mergeMessages(previous, incoming, true));
        } else if (mode === "after") {
          if (incoming.length) {
            setMessages((previous) => mergeMessages(previous, incoming));
          }
        } else {
          setMessages(incoming);
        }

        if (mode !== "after") {
          setHasOlderMessages(Boolean(response.data.pagination?.hasMore));
        }
        setError("");
        return incoming;
      } catch (err) {
        const wasCancelled =
          err.code === "ERR_CANCELED" || err.name === "CanceledError";
        if (!wasCancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load messages. Please try again.",
          );
        }
        return null;
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [bookingId],
  );

  // Keep a current message snapshot for stable polling callbacks.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
    latestMessageIdRef.current = messages[messages.length - 1]?._id || null;
  }, [messages]);

  // Initial page + non-overlapping polling. Poll only while the tab is visible.
  useEffect(() => {
    if (!bookingId) {
      setMessages([]);
      setHasOlderMessages(false);
      setLoading(false);
      return undefined;
    }

    let active = true;
    let timeoutId;
    let polling = false;
    const controller = new AbortController();

    const pollMessages = async (initial = false) => {
      if (!active || polling) return;
      polling = true;
      try {
        if (document.visibilityState === "visible") {
          if (initial) setLoading(true);
          await fetchMessages({
            mode: latestMessageIdRef.current ? "after" : "latest",
            signal: controller.signal,
          });
        }
      } finally {
        if (initial) setLoading(false);
        polling = false;
        if (active)
          timeoutId = setTimeout(() => pollMessages(false), CHAT_POLL_INTERVAL);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && active) {
        clearTimeout(timeoutId);
        if (!polling) pollMessages(false);
      }
    };

    setMessages([]);
    setHasOlderMessages(false);
    latestMessageIdRef.current = null;
    messagesRef.current = [];
    pollMessages(true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controller.abort();
    };
  }, [bookingId, fetchMessages]);

  const handleLoadOlder = async () => {
    if (loadingOlder || !hasOlderMessages || requestInFlightRef.current) return;
    setLoadingOlder(true);
    await fetchMessages({ mode: "older" });
    setLoadingOlder(false);
  };

  // Preserve scroll position after prepending older messages; otherwise follow new messages.
  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    if (pendingOlderScrollRef.current) {
      const previous = pendingOlderScrollRef.current;
      list.scrollTop = previous.top + (list.scrollHeight - previous.height);
      pendingOlderScrollRef.current = null;
      return;
    }

    const lastId = messages[messages.length - 1]?._id || null;
    if (lastId && lastId !== previousLastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    previousLastMessageIdRef.current = lastId;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending || !bookingId) return;

    try {
      setSending(true);
      setError("");
      const response = await API.post(`/bookings/${bookingId}/messages`, {
        message: trimmedMessage,
      });
      const sentMessage = response.data.data;
      if (sentMessage) {
        setMessages((previous) => mergeMessages(previous, [sentMessage]));
      }
      setMessage("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-indigo-600 px-5 py-4 text-white">
        <h2 className="text-lg font-bold">Booking Chat</h2>
        <p className="mt-1 text-sm text-indigo-100">
          Communicate with your customer or service provider
        </p>
      </div>

      {/* Messages */}
      <div
        ref={messageListRef}
        className="h-96 space-y-4 overflow-y-auto bg-gray-50 p-4"
      >
        {hasOlderMessages && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-60"
            >
              {loadingOlder
                ? "Loading older messages..."
                : "Load older messages"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-3 font-semibold text-gray-700">No messages yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((item) => {
            const isMine =
              String(item.sender?._id || item.sender) === String(currentUserId);

            return (
              <div
                key={item._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    isMine
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {item.message}
                  </p>
                  <p
                    className={`mt-2 text-right text-xs ${
                      isMine ? "text-indigo-100" : "text-gray-400"
                    }`}
                  >
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border-t border-gray-200 p-4"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
          disabled={sending || !bookingId}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending || !bookingId}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default BookingChat;
