import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AIPanelProps {
  type: "summary" | "actions" | "chat";
  onClose: () => void;
}

export const AIPanel = ({ type, onClose }: AIPanelProps) => {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>
              {type === "summary" && "Conversation Summary"}
              {type === "actions" && "Action Items"}
              {type === "chat" && "Ask me anything"}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      {type === "summary" && <Summary />}
      {type === "actions" && <Actions />}
      {type === "chat" && <Chat />}
    </View>
  );
};

/* ================= SUMMARY ================= */

const Summary = () => (
  <ScrollView style={styles.content}>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>AI Summary</Text>
      <Text style={styles.cardText}>
        The team is discussing the Q1 roadmap review and planning next steps.
      </Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Participants</Text>
      {["Sarah", "Mike", "Emma", "You"].map((name, i) => (
        <View key={i} style={styles.listItem}>
          <Text>{name}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

/* ================= ACTIONS ================= */

const Actions = () => {
  const items = [
    "Prepare engineering estimates",
    "Present interview findings",
    "Include customer feedback",
  ];

  return (
    <ScrollView style={styles.content}>
      {items.map((item, i) => (
        <View key={i} style={styles.actionItem}>
          <Ionicons name="ellipse-outline" size={18} color="#2563EB" />
          <Text style={styles.actionText}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

/* ================= CHAT ================= */

const Chat = () => {
  const [tab, setTab] = useState<"chat" | "analyze" | "help">("chat");

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {["chat", "analyze", "help"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as any)}
            style={[
              styles.tabButton,
              tab === t && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === t && { color: "#fff" },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {tab === "chat" && (
          <Text style={styles.cardText}>
            Hi! I'm your AI assistant.
          </Text>
        )}
        {tab === "analyze" && (
          <Text style={styles.cardText}>
            Channel analytics will appear here.
          </Text>
        )}
        {tab === "help" && (
          <Text style={styles.cardText}>
            Learn how to use AI features.
          </Text>
        )}
      </ScrollView>

      {/* Input */}
      {tab === "chat" && (
        <View style={styles.inputBar}>
          <TextInput
            placeholder="Ask AI anything..."
            style={styles.textInput}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#374151",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    marginLeft: 10,
    fontSize: 14,
  },
  tabs: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#2563EB",
  },
  tabText: {
    fontSize: 13,
    color: "#374151",
  },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
});