import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { MessageActionSheet } from "./MessageActionSheet";

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  isPinned?: boolean;
}

interface Props {
  onBack: () => void;
}

export default function ChatView({ onBack }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      author: "Sarah",
      content: "Let's finalize the Q1 roadmap.",
      timestamp: "10:23 AM",
    },
    {
      id: "2",
      author: "You",
      content: "I'll prepare the engineering estimates.",
      timestamp: "10:25 AM",
      isOwn: true,
    },
  ]);

  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  /* ---------- SEND MESSAGE ---------- */

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      author: "You",
      content: message,
      timestamp: "Now",
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  /* ---------- ACTION SHEET HANDLERS ---------- */

  const handleReply = () => {
    if (!selectedMessage) return;
    setMessage(`Replying to: "${selectedMessage.content}"\n`);
  };

  const handlePin = () => {
    if (!selectedMessage) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === selectedMessage.id
          ? { ...msg, isPinned: !msg.isPinned }
          : msg
      )
    );
  };

  const handleAskAI = () => {
    if (!selectedMessage) return;

    const aiMessage: Message = {
      id: Date.now().toString(),
      author: "AI",
      content: `Here's insight about: "${selectedMessage.content}"`,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  /* ---------- RENDER MESSAGE ---------- */

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onLongPress={() => {
        setSelectedMessage(item);
        setShowSheet(true);
      }}
      activeOpacity={0.8}
      style={[
        styles.messageRow,
        item.isOwn && { flexDirection: "row-reverse" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.isOwn && styles.ownBubble,
        ]}
      >
        {!item.isOwn && (
          <Text style={styles.author}>
            {item.author}
          </Text>
        )}

        <Text
          style={[
            styles.messageText,
            item.isOwn && { color: "#fff" },
          ]}
        >
          {item.content}
        </Text>

        <View style={styles.metaRow}>
          {item.isPinned && (
            <Ionicons
              name="pin"
              size={12}
              color="#F59E0B"
            />
          )}
          <Text style={styles.timestamp}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>#general</Text>
      </View>

      {/* MESSAGE LIST */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity
          disabled={!message.trim()}
          onPress={handleSend}
          style={[
            styles.sendBtn,
            !message.trim() && { opacity: 0.5 },
          ]}
        >
          <Ionicons
            name="send"
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ACTION SHEET */}
      <MessageActionSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        onReply={handleReply}
        onPin={handlePin}
        onAskAI={handleAskAI}
        messagePreview={selectedMessage?.content}
        isPinned={selectedMessage?.isPinned}
      />
    </KeyboardAvoidingView>
  );
};

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    marginLeft: 12,
    fontWeight: "600",
    fontSize: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  bubble: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  ownBubble: {
    backgroundColor: "#2563EB",
  },
  author: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    color: "#6B7280",
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 20,
    justifyContent: "center",
  },
});