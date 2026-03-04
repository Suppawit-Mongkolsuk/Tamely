import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onStartChat?: () => void;
}

export const EmptyChatList = ({ onStartChat }: Props) => {
  return (
    <View style={styles.container}>
      {/* Main Icon */}
      <View style={styles.iconWrapper}>
        <Ionicons
          name="chatbubble-ellipses"
          size={48}
          color="#2563EB"
        />
      </View>

      {/* Title */}
      <View style={styles.textSection}>
        <Text style={styles.title}>
          No conversations yet
        </Text>
        <Text style={styles.subtitle}>
          Start chatting with your team or create a new room.
        </Text>
      </View>

      {/* Main Action */}
      <TouchableOpacity
        onPress={onStartChat}
        style={styles.primaryButton}
      >
        <Ionicons
          name="chatbubble-outline"
          size={18}
          color="#fff"
        />
        <Text style={styles.primaryText}>
          Start a Conversation
        </Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        <QuickButton
          icon="people-outline"
          label="Browse Rooms"
          color="#2563EB"
        />
        <QuickButton
          icon="sparkles"
          label="Ask AI"
          color="#7C3AED"
        />
        <QuickButton
          icon="search-outline"
          label="Search"
          color="#16A34A"
        />
      </View>

      {/* AI Tip */}
      <View style={styles.tipBox}>
        <Ionicons
          name="sparkles"
          size={16}
          color="#fff"
          style={styles.tipIcon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>
            AI Assistant Tip
          </Text>
          <Text style={styles.tipText}>
            Mention @AI in any chat to get summaries
            or extract action items.
          </Text>
        </View>
      </View>
    </View>
  );
};

/* ---------- QUICK BUTTON COMPONENT ---------- */

const QuickButton = ({
  icon,
  label,
  color,
}: {
  icon: any;
  label: string;
  color: string;
}) => (
  <TouchableOpacity style={styles.quickButton}>
    <View
      style={[
        styles.quickIcon,
        { backgroundColor: `${color}20` },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickButton: {
    alignItems: "center",
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#374151",
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF2FF",
    padding: 14,
    borderRadius: 14,
    width: "100%",
  },
  tipIcon: {
    marginRight: 8,
    backgroundColor: "#2563EB",
    padding: 6,
    borderRadius: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: "#6B7280",
  },
});