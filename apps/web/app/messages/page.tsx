"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../_trpc/trpc";

export default function MessagesPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    recipientId: "",
    subject: "",
    body: "",
  });

  const utils = trpc.useContext();

  // Get messages
  const { data: inboxMessages } = trpc.viewer.swim.messaging.getInbox.useQuery({});
  const { data: sentMessages } = trpc.viewer.swim.messaging.getSent.useQuery();
  const { data: unreadCount } = trpc.viewer.swim.messaging.getUnreadCount.useQuery();

  const messages = activeTab === "inbox" ? inboxMessages : sentMessages;
  const selected = messages?.find((m) => m.id === selectedMessage);

  // Mutations
  const sendMutation = trpc.viewer.swim.messaging.send.useMutation({
    onSuccess: () => {
      showToast("Message sent successfully", "success");
      setShowCompose(false);
      setComposeData({ recipientId: "", subject: "", body: "" });
      utils.viewer.swim.messaging.getSent.invalidate();
    },
    onError: (error) => {
      showToast(error.message || "Failed to send message", "error");
    },
  });

  const markAsReadMutation = trpc.viewer.swim.messaging.markAsRead.useMutation({
    onSuccess: () => {
      utils.viewer.swim.messaging.getInbox.invalidate();
      utils.viewer.swim.messaging.getUnreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.viewer.swim.messaging.delete.useMutation({
    onSuccess: () => {
      showToast("Message deleted", "success");
      setSelectedMessage(null);
      utils.viewer.swim.messaging.getInbox.invalidate();
      utils.viewer.swim.messaging.getSent.invalidate();
    },
    onError: (error) => {
      showToast(error.message || "Failed to delete message", "error");
    },
  });

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessage(messageId);
    const msg = messages?.find((m) => m.id === messageId);
    if (msg && !msg.read && activeTab === "inbox") {
      markAsReadMutation.mutate({ messageId });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.recipientId || !composeData.body) {
      showToast("Please fill in recipient and message", "error");
      return;
    }

    sendMutation.mutate({
      recipientId: Number(composeData.recipientId),
      subject: composeData.subject || undefined,
      body: composeData.body,
    });
  };

  const handleDelete = () => {
    if (!selectedMessage) return;
    if (confirm("Delete this message?")) {
      deleteMutation.mutate({ messageId: selectedMessage });
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          ✉️ New Message
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Message List */}
        <div className="overflow-hidden rounded-lg border md:col-span-1">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "inbox"
                  ? "border-b-2 border-blue-700 bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              Inbox {unreadCount ? `(${unreadCount})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "sent"
                  ? "border-b-2 border-blue-700 bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              Sent
            </button>
          </div>

          {/* Message List */}
          <div className="max-h-[600px] divide-y overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg.id)}
                  className={`w-full p-3 text-left hover:bg-gray-50 ${
                    selectedMessage === msg.id ? "bg-blue-50" : ""
                  } ${!msg.read && activeTab === "inbox" ? "font-semibold" : ""}`}>
                  <div className="mb-1 flex items-start justify-between">
                    <span className="text-sm font-medium">
                      {activeTab === "inbox"
                        ? msg.sender?.name || "Unknown"
                        : msg.recipient?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {msg.subject && <div className="mb-1 text-sm text-gray-700">{msg.subject}</div>}
                  <div className="truncate text-xs text-gray-500">{msg.body.slice(0, 50)}...</div>
                  {msg.swimmer && <div className="mt-1 text-xs text-blue-600">Re: {msg.swimmer.name}</div>}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">No messages</div>
            )}
          </div>
        </div>

        {/* Message Detail or Compose */}
        <div className="rounded-lg border p-6 md:col-span-2">
          {showCompose ? (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <h2 className="mb-4 text-lg font-semibold">New Message</h2>

              <div>
                <label className="mb-2 block text-sm font-medium">Recipient ID</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={composeData.recipientId}
                  onChange={(e) => setComposeData({ ...composeData, recipientId: e.target.value })}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the user ID of the recipient (instructor or parent)
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Subject (Optional)</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Message</label>
                <textarea
                  className="w-full resize-none rounded border px-3 py-2"
                  rows={8}
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  disabled={sendMutation.isLoading}>
                  {sendMutation.isLoading ? "Sending..." : "Send Message"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          ) : selected ? (
            <div>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selected.subject || "(No Subject)"}</h2>
                  <p className="text-sm text-gray-600">
                    {activeTab === "inbox" ? "From" : "To"}:{" "}
                    {activeTab === "inbox"
                      ? selected.sender?.name || "Unknown"
                      : selected.recipient?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(selected.createdAt).toLocaleString()}</p>
                  {selected.swimmer && (
                    <p className="mt-1 text-sm text-blue-600">Regarding: {selected.swimmer.name}</p>
                  )}
                </div>
                <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700">
                  🗑️ Delete
                </button>
              </div>

              <div className="border-t pt-4">
                <p className="whitespace-pre-wrap">{selected.body}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
