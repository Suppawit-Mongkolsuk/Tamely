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

interface SearchViewProps {
  onBack: () => void;
}

type TabType = "all" | "messages" | "files" | "people";

export const SearchView = ({ onBack }: SearchViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [query, setQuery] = useState("");

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* SEARCH INPUT */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages, files, people..."
          style={styles.searchInput}
        />
        <Ionicons name="filter" size={18} color="#6B7280" />
      </View>

      {/* AI BANNER */}
      <View style={styles.aiBanner}>
        <Ionicons name="sparkles" size={16} color="#fff" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.aiTitle}>Try AI Search</Text>
          <Text style={styles.aiSubtitle}>
            Ask questions in natural language
          </Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {["all", "messages", "files", "people"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      <ScrollView style={{ flex: 1 }}>
        {activeTab === "all" && <AllResults />}
        {activeTab === "messages" && <MessageResults />}
        {activeTab === "files" && <FileResults />}
        {activeTab === "people" && <PeopleResults />}
      </ScrollView>
    </View>
  );
};

const AllResults = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Recent Searches</Text>
    {["Q1 roadmap", "design review", "sprint planning"].map(
      (item, i) => (
        <View key={i} style={styles.listRow}>
          <Ionicons name="search" size={16} />
          <Text style={{ marginLeft: 10 }}>{item}</Text>
        </View>
      )
    )}
  </View>
);

const MessageResults = () => (
  <View style={styles.section}>
    {[
      {
        author: "Sarah Johnson",
        channel: "general",
        content: "Let's schedule the roadmap review",
      },
      {
        author: "Mike Chen",
        channel: "engineering",
        content: "Roadmap document updated",
      },
    ].map((msg, i) => (
      <View key={i} style={styles.card}>
        <Text style={styles.title}>
          {msg.author} • #{msg.channel}
        </Text>
        <Text style={styles.subtitle}>{msg.content}</Text>
      </View>
    ))}
  </View>
);

const FileResults = () => (
  <View style={styles.section}>
    {[
      { name: "Q1_Roadmap.pdf", size: "2.4MB" },
      { name: "Estimates.xlsx", size: "156KB" },
    ].map((file, i) => (
      <View key={i} style={styles.card}>
        <Text style={styles.title}>{file.name}</Text>
        <Text style={styles.subtitle}>{file.size}</Text>
      </View>
    ))}
  </View>
);

const PeopleResults = () => (
  <View style={styles.section}>
    {[
      { name: "Sarah Johnson", role: "Product Manager" },
      { name: "Mike Chen", role: "Engineering Lead" },
    ].map((person, i) => (
      <View key={i} style={styles.card}>
        <Text style={styles.title}>{person.name}</Text>
        <Text style={styles.subtitle}>{person.role}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
  },

  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
  },
  aiTitle: { color: "#fff", fontWeight: "600" },
  aiSubtitle: { color: "#E0E7FF", fontSize: 12 },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: "#2563EB",
  },
  tabText: { fontSize: 12, color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  section: { padding: 16 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  card: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 10,
  },

  title: { fontWeight: "600", marginBottom: 4 },
  subtitle: { color: "#4B5563", fontSize: 13 },
});