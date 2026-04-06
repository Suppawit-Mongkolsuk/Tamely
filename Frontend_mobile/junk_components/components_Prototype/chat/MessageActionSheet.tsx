import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReply: () => void;
  onPin: () => void;
  onAskAI: () => void;
  messagePreview?: string;
  isPinned?: boolean;
}

const { height } = Dimensions.get("window");

export const MessageActionSheet = ({
  isOpen,
  onClose,
  onReply,
  onPin,
  onAskAI,
  messagePreview,
  isPinned = false,
}: Props) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
    >
      {/* BACKDROP */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* SHEET */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* HANDLE */}
        <View style={styles.handle} />

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Message Actions
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {messagePreview && (
          <Text
            numberOfLines={2}
            style={styles.preview}
          >
            {messagePreview}
          </Text>
        )}

        {/* ACTIONS */}
        <ActionItem
          icon="chatbubble-outline"
          label="Reply"
          description="Start a thread"
          color="#2563EB"
          onPress={() => handleAction(onReply)}
        />

        <ActionItem
          icon="pin-outline"
          label={
            isPinned
              ? "Unpin message"
              : "Pin message"
          }
          description={
            isPinned
              ? "Remove from pinned"
              : "Keep this important"
          }
          color="#F59E0B"
          onPress={() => handleAction(onPin)}
        />

        <ActionItem
          icon="sparkles"
          label="Ask AI"
          description="Get AI insight"
          color="#7C3AED"
          onPress={() => handleAction(onAskAI)}
        />
      </Animated.View>
    </Modal>
  );
};

/* ---------- ACTION ITEM ---------- */

const ActionItem = ({
  icon,
  label,
  description,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.actionRow}
    onPress={onPress}
  >
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: `${color}20` },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={color}
      />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.actionLabel}>
        {label}
      </Text>
      <Text style={styles.actionDesc}>
        {description}
      </Text>
    </View>
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
  },
  preview: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionDesc: {
    fontSize: 12,
    color: "#6B7280",
  },
});