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
import { useState, useRef } from "react";

interface Message {
  id: string;
  author: string;
  initials: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  isAI?: boolean;
}

interface DirectMessageScreenProps {
  contactName: string;
  contactInitials: string;
  isOnline?: boolean;
  onBack: () => void;
}

export const DirectMessageScreen = ({
  contactName,
  contactInitials,
  isOnline = true,
  onBack,
}: DirectMessageScreenProps) => {
  const [message, setMessage] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const messages: Message[] = [
    {
      id: "1",
      author: contactName,
      initials: contactInitials,
      content:
        "Hey! I wanted to discuss the Q1 roadmap.",
      timestamp: "10:23 AM",
    },
    {
      id: "2",
      author: "You",
      initials: "YO",
      content:
        "Should we loop in @AI to summarize previous discussions?",
      timestamp: "10:25 AM",
      isOwn: true,
    },
    {
      id: "3",
      author: "AI Assistant",
      initials: "AI",
      content:
        "I've reviewed your previous discussions. Want a detailed summary?",
      timestamp: "10:28 AM",
      isAI: true,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  const handleMentionAI = () => {
    setMessage((prev) => prev + "@AI ");
    inputRef.current?.focus();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const parts = item.content.split(/(@\w+)/g);

    return (
      <View
        style={[
          styles.messageRow,
          item.isOwn && { flexDirection: "row-reverse" },
        ]}
      >
        {!item.isOwn && (
          <View
            style={[
              styles.avatar,
              item.isAI && styles.aiAvatar,
            ]}
          >
            <Text style={styles.initials}>
              {item.isAI ? "AI" : item.initials}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            item.isOwn && styles.ownBubble,
          ]}
        >
          {!item.isOwn && (
            <Text style={styles.author}>{item.author}</Text>
          )}

          <Text
            style={[
              styles.messageText,
              item.isOwn && { color: "#fff" },
            ]}
          >
            {parts.map((part, i) =>
              part.startsWith("@") ? (
                <Text
                  key={i}
                  style={[
                    styles.mention,
                    part === "@AI" && styles.aiMention,
                  ]}
                >
                  {part}
                </Text>
              ) : (
                part
              )
            )}
          </Text>

          <Text style={styles.timestamp}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

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

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.contactName}>
            {contactName}
          </Text>
          <Text style={styles.status}>
            {isOnline ? "Active now" : "Offline"}
          </Text>
        </View>

        <Ionicons name="call-outline" size={20} />
      </View>

      {/* MESSAGES */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* MENTION AI BAR */}
      <TouchableOpacity
        style={styles.mentionBar}
        onPress={handleMentionAI}
      >
        <Ionicons name="sparkles" size={16} color="#2563EB" />
        <Text style={styles.mentionBarText}>
          Ask @AI to join conversation
        </Text>
      </TouchableOpacity>

      {/* ATTACHMENT MENU */}
      {showAttachmentMenu && (
        <View style={styles.attachmentMenu}>
          <Text style={styles.attachmentItem}>
            📷 Photo
          </Text>
          <Text style={styles.attachmentItem}>
            📎 File
          </Text>
        </View>
      )}

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={() =>
            setShowAttachmentMenu((p) => !p)
          }
          style={styles.iconBtn}
        >
          <Ionicons name="attach" size={20} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
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
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactName: {
    fontWeight: "600",
    fontSize: 16,
  },
  status: {
    fontSize: 12,
    color: "#6B7280",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  aiAvatar: {
    backgroundColor: "#2563EB",
  },
  initials: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  bubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 12,
    maxWidth: "75%",
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
  mention: {
    color: "#2563EB",
    fontWeight: "600",
  },
  aiMention: {
    color: "#7C3AED",
  },
  timestamp: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  mentionBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  mentionBarText: {
    fontSize: 13,
  },
  attachmentMenu: {
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  attachmentItem: {
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: {
    marginRight: 10,
    justifyContent: "center",
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 20,
    justifyContent: "center",
  },
});