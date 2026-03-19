import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MessageSquare,
  Home,
  Sparkles,
  Bell,
  User,
} from "lucide-react-native";

export type TabType =
  | "feed"
  | "chats"
  | "ai"
  | "notifications"
  | "profile";

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadChats?: number;
  unreadNotifications?: number;
}

const tabs = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "profile", label: "Profile", icon: User },
] as const;

export default function BottomTabBar({
  activeTab,
  onTabChange,
  unreadChats = 0,
  unreadNotifications = 0,
}: BottomTabBarProps) {
  const getBadge = (id: TabType) => {
    if (id === "chats") return unreadChats;
    if (id === "notifications") return unreadNotifications;
    return 0;
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = getBadge(tab.id);

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              {/* Badge */}
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Text>
                </View>
              )}

              {/* Icon */}
              <Icon
                size={24}
                color={isActive ? "#2563eb" : "#777"}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>

              {/* Active Indicator */}
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },

  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    width: 70,
  },

  label: {
    fontSize: 11,
    marginTop: 4,
    color: "#777",
  },

  activeLabel: {
    color: "#2563eb",
    fontWeight: "600",
  },

  indicator: {
    position: "absolute",
    bottom: -6,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2563eb",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
});