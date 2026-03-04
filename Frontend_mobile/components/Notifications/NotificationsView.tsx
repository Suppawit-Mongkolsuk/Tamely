import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  MessageSquare,
  UserPlus,
  Sparkles,
  AtSign,
  Settings,
} from "lucide-react-native";

type NotificationType = "message" | "mention" | "ai" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  channel?: string;
}

type TabType = "all" | "unread" | "mentions";

export default function NotificationsView() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const notifications: Notification[] = [
    {
      id: "1",
      type: "mention",
      title: "Sarah mentioned you",
      content: "@you Can you review the roadmap?",
      timestamp: "5m ago",
      isRead: false,
      channel: "product-team",
    },
    {
      id: "2",
      type: "ai",
      title: "AI Summary Ready",
      content: "Your daily summary is ready",
      timestamp: "1h ago",
      isRead: false,
      channel: "engineering",
    },
    {
      id: "3",
      type: "system",
      title: "Emma joined #design",
      content: "Emma is now part of the team",
      timestamp: "Yesterday",
      isRead: true,
      channel: "design",
    },
  ];

  const filteredNotifications = () => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab === "mentions") {
      return notifications.filter((n) => n.type === "mention");
    }
    return notifications;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.card,
        !item.isRead && styles.unreadCard,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.iconBox}>
        {getIcon(item.type)}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.timestamp}</Text>
        </View>

        <Text style={styles.content}>{item.content}</Text>

        {item.channel && (
          <Text style={styles.channel}>#{item.channel}</Text>
        )}
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Settings size={22} color="#333" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {["all", "unread", "mentions"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as TabType)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredNotifications()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={40} color="#ccc" />
            <Text style={{ color: "#888", marginTop: 10 }}>
              No notifications
            </Text>
          </View>
        }
      />

      {/* Mark All Read */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={styles.markAllText}>
            Mark All as Read
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function getIcon(type: NotificationType) {
  switch (type) {
    case "mention":
      return <AtSign size={20} color="#2563eb" />;
    case "ai":
      return <Sparkles size={20} color="#7c3aed" />;
    case "message":
      return <MessageSquare size={20} color="#16a34a" />;
    case "system":
      return <UserPlus size={20} color="#555" />;
    default:
      return <Bell size={20} color="#555" />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginRight: 10,
  },

  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: "#2563eb20",
  },

  tabText: {
    fontSize: 13,
    color: "#777",
  },

  activeTabText: {
    color: "#2563eb",
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  unreadCard: {
    backgroundColor: "#f0f7ff",
    borderColor: "#dbeafe",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },

  time: {
    fontSize: 11,
    color: "#999",
  },

  content: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },

  channel: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 4,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
    marginLeft: 8,
    alignSelf: "center",
  },

  empty: {
    alignItems: "center",
    marginTop: 60,
  },

  markAllBtn: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  markAllText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
  },
});