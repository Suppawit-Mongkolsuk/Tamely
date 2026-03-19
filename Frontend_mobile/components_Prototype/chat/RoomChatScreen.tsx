import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  author: string;
  initials: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  isAI?: boolean;
  isPinned?: boolean;
  threadCount?: number;
  reactions?: { emoji: string; count: number; userReacted?: boolean }[];
}

interface RoomChatScreenProps {
  roomName: string;
  roomDescription?: string;
  memberCount: number;
  isPrivate?: boolean;
  onBack: () => void;
  onRoomInfo: () => void;
}

export const RoomChatScreen = ({
  roomName,
  roomDescription,
  memberCount,
  isPrivate = false,
  onBack,
  onRoomInfo,
}: RoomChatScreenProps) => {
  const [message, setMessage] = useState("");
  const [showPinned, setShowPinned] = useState(false);

  const messages: Message[] = [
    {
      id: "1",
      author: "Sarah Johnson",
      initials: "SJ",
      content:
        "Team, let's finalize the Q1 roadmap by end of week.",
      timestamp: "10:23 AM",
      isPinned: true,
      reactions: [
        { emoji: "👍", count: 5, userReacted: true },
        { emoji: "✅", count: 3 },
      ],
    },
    {
      id: "2",
      author: "AI Assistant",
      initials: "AI",
      content:
        "Top customer requests:\n1. Advanced filters\n2. Mobile improvements\n3. Slack integration",
      timestamp: "10:28 AM",
      isAI: true,
    },
  ];

  const pinned = messages.filter((m) => m.isPinned);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, marginLeft: 12 }}
          onPress={onRoomInfo}
        >
          <Text style={styles.roomName}>
            {isPrivate ? "" : "#"}
            {roomName}
          </Text>
          <Text style={styles.roomMeta}>
            {memberCount} members
            {roomDescription && ` • ${roomDescription}`}
          </Text>
        </TouchableOpacity>

        <Ionicons name="ellipsis-vertical" size={20} />
      </View>

      {/* PINNED BANNER */}
      {pinned.length > 0 && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={() => setShowPinned(!showPinned)}
        >
          <Ionicons name="pin" size={14} color="#B45309" />
          <Text style={{ flex: 1 }}>
            {pinned.length} pinned message
          </Text>
          <Ionicons
            name={showPinned ? "chevron-down" : "chevron-forward"}
            size={14}
          />
        </TouchableOpacity>
      )}

      {/* PINNED EXPANDED */}
      {showPinned &&
        pinned.map((msg) => (
          <View key={msg.id} style={styles.pinnedCard}>
            <Text style={styles.author}>{msg.author}</Text>
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}

      {/* MESSAGES */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageRow}>
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                msg.isAI && styles.aiAvatar,
              ]}
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>
                {msg.initials}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.author}>
                {msg.author} • {msg.timestamp}
              </Text>

              <View
                style={[
                  styles.bubble,
                  msg.isAI && styles.aiBubble,
                ]}
              >
                <Text style={styles.messageText}>
                  {msg.content}
                </Text>
              </View>

              {/* Reactions */}
              {msg.reactions && (
                <View style={styles.reactionRow}>
                  {msg.reactions.map((r, i) => (
                    <View
                      key={i}
                      style={[
                        styles.reaction,
                        r.userReacted && styles.reactionActive,
                      ]}
                    >
                      <Text>
                        {r.emoji} {r.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={`Message #${roomName}`}
          style={styles.input}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            !message.trim() && { opacity: 0.5 },
          ]}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  roomName: {
    fontWeight: "600",
    fontSize: 16,
  },
  roomMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 10,
    margin: 12,
    borderRadius: 10,
  },
  pinnedCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  aiAvatar: {
    backgroundColor: "#7C3AED",
  },
  author: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  bubble: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 12,
  },
  aiBubble: {
    backgroundColor: "#EEF2FF",
  },
  messageText: {
    fontSize: 14,
  },
  reactionRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  reaction: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  reactionActive: {
    backgroundColor: "#DBEAFE",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 20,
  },
});