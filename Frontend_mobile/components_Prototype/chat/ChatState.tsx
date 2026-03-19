import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ================= LOADING ================= */

export const ChatLoadingState = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#2563EB" />
    <Text style={styles.title}>Loading messages...</Text>
    <Text style={styles.subtitle}>This won't take long</Text>
  </View>
);

/* ================= ERROR ================= */

export const ChatErrorState = ({
  onRetry,
}: {
  onRetry?: () => void;
}) => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: "#FEE2E2" }]}>
      <Ionicons name="warning-outline" size={30} color="#DC2626" />
    </View>

    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.subtitle}>
      We couldn't load your messages. Please try again.
    </Text>

    {onRetry && (
      <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ================= PERMISSION ================= */

export const ChatPermissionDeniedState = () => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
      <Ionicons name="lock-closed-outline" size={30} color="#D97706" />
    </View>

    <Text style={styles.title}>No Access</Text>
    <Text style={styles.subtitle}>
      You don't have permission to view this conversation.
    </Text>

    <TouchableOpacity style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>Request Access</Text>
    </TouchableOpacity>
  </View>
);

/* ================= EMPTY ================= */

export const ChatEmptyState = ({
  onStartChat,
}: {
  onStartChat?: () => void;
}) => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: "#DBEAFE" }]}>
      <Ionicons name="chatbubble-ellipses-outline" size={30} color="#2563EB" />
    </View>

    <Text style={styles.title}>No messages yet</Text>
    <Text style={styles.subtitle}>
      Start the conversation! Send your first message below.
    </Text>

    {onStartChat && (
      <TouchableOpacity style={styles.primaryButton} onPress={onStartChat}>
        <Text style={styles.primaryButtonText}>Start Conversation</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ================= OFFLINE ================= */

export const ChatOfflineState = () => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: "#F3F4F6" }]}>
      <Ionicons name="wifi-outline" size={30} color="#6B7280" />
    </View>

    <Text style={styles.title}>You're offline</Text>
    <Text style={styles.subtitle}>
      Check your internet connection and try again.
    </Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
});