import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm" | "ai";
  unread?: number;
  lastMessage?: string;
  timestamp?: string;
  isPrivate?: boolean;
  initials?: string;
  online?: boolean;
}

interface ChatListProps {
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onAIAssistant: () => void;
}

export const ChatList = ({
  onSelectChat,
  onNewChat,
  onAIAssistant,
}: ChatListProps) => {
  const channels: Channel[] = [
    {
      id: "ai-assistant",
      name: "AI Assistant",
      type: "ai",
      lastMessage: "I can help you summarize conversations...",
      timestamp: "Now",
    },
    {
      id: "1",
      name: "general",
      type: "channel",
      unread: 3,
      lastMessage: "Sarah: Let's schedule the review meeting",
      timestamp: "2m ago",
    },
    {
      id: "4",
      name: "Sarah Johnson",
      type: "dm",
      unread: 1,
      lastMessage: "Can you review the design?",
      timestamp: "1h ago",
      initials: "SJ",
      online: true,
    },
  ];

  const renderItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onSelectChat(item.id)}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View
          style={[
            styles.avatar,
            item.type === "ai" && styles.aiAvatar,
          ]}
        >
          {item.type === "ai" ? (
            <Ionicons name="sparkles" size={18} color="#fff" />
          ) : item.type === "channel" ? (
            <Ionicons
            name={(item.isPrivate ? "lock-closed" : "hash") as any}
            size={18}
            color="#374151"
            />
          ) : (
            <Text style={styles.initials}>{item.initials}</Text>
          )}
        </View>

        {item.online && (
          <View style={styles.onlineDot} />
        )}
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {item.type === "channel" && !item.isPrivate ? "#" : ""}
            {item.name}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>

          {item.unread && item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.workspace}>Workspace</Text>
        <TouchableOpacity onPress={onNewChat}>
          <Ionicons name="add" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          placeholder="Search messages..."
          style={styles.searchInput}
        />
      </View>

      {/* AI Banner */}
      <TouchableOpacity
        style={styles.aiBanner}
        onPress={onAIAssistant}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.aiBannerText}>Ask AI Assistant</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  workspace: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  aiBannerText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  chatItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatar: {
    backgroundColor: "#2563EB",
  },
  initials: {
    fontWeight: "600",
    color: "#374151",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatName: {
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
  },
  badge: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});