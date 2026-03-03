import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Pin,
  Calendar,
  Eye,
} from "lucide-react-native";

interface Announcement {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  author: string;
  timestamp: string;
  isPinned: boolean;
  views?: number;
}

export default function FeedView() {
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const announcements: Announcement[] = [
    {
      id: "1",
      title: "Q1 Product Roadmap Review",
      description:
        "Please review the updated roadmap and provide feedback.",
      content:
        "Detailed roadmap content goes here...",
      tags: ["Engineering", "General"],
      author: "Sarah Johnson",
      timestamp: "2 hours ago",
      isPinned: true,
    },
    {
      id: "2",
      title: "Team Building Event - Friday 5PM",
      description:
        "Join us for a team building activity this Friday at 5PM.",
      content:
        "Event details and RSVP information...",
      tags: ["Company-wide"],
      author: "HR Team",
      timestamp: "2 hours ago",
      isPinned: true,
      views: 120,
    },
    {
      id: "3",
      title: "Security Update Required",
      description:
        "Complete security training by Friday.",
      content:
        "Security training instructions...",
      tags: ["Security"],
      author: "IT Department",
      timestamp: "2 days ago",
      isPinned: false,
      views: 90,
    },
  ];

  const pinned = announcements.filter((a) => a.isPinned);
  const recent = announcements.filter((a) => !a.isPinned);

  const renderCard = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedAnnouncement(item)}
    >
      {item.isPinned && (
        <Pin size={16} color="#555" style={{ marginBottom: 4 }} />
      )}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.tagRow}>
        {item.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Calendar size={14} color="#666" />
          <Text style={styles.footerText}>{item.timestamp}</Text>
        </View>
        {item.views && (
          <View style={styles.footerLeft}>
            <Eye size={14} color="#666" />
            <Text style={styles.footerText}>{item.views}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Feed</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with announcements
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#999" />
          <TextInput
            placeholder="Search announcements..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {pinned.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Pinned Announcements
                </Text>
                {pinned.map((item) => (
                  <View key={item.id}>
                    {renderCard({ item })}
                  </View>
                ))}
              </>
            )}
            <Text style={styles.sectionTitle}>
              Recent Announcements
            </Text>
          </>
        }
        data={recent}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        animationType="slide"
      >
        <SafeAreaView style={styles.detailContainer}>
          <TouchableOpacity
            onPress={() => setSelectedAnnouncement(null)}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.detailTitle}>
              {selectedAnnouncement?.title}
            </Text>
            <Text style={styles.detailContent}>
              {selectedAnnouncement?.content}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },

  header: {
    padding: 20,
    backgroundColor: "#003366",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  headerSubtitle: { color: "#cce0ff", fontSize: 13 },
  addButton: {
    backgroundColor: "#0055aa",
    padding: 10,
    borderRadius: 10,
  },

  searchRow: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginLeft: 8, flex: 1 },
  filterBtn: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 15,
    marginVertical: 10,
    color: "#555",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  description: { fontSize: 14, color: "#666", marginBottom: 10 },

  tagRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tag: {
    backgroundColor: "#e6f0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 12, color: "#0055aa" },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: { fontSize: 12, color: "#666", marginLeft: 4 },

  detailContainer: { flex: 1, padding: 20 },
  backText: { color: "#007aff", marginBottom: 15 },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailContent: { fontSize: 14, lineHeight: 22 },
});