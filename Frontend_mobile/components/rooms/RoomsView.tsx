import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
} from "react-native";
import {
  Plus,
  Search,
  Hash,
  Lock,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";

interface Room {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  members: number;
  unread?: number;
  isActive?: boolean;
  activity?: "high" | "medium" | "low";
}

export default function RoomsView() {
  const [searchQuery, setSearchQuery] = useState("");

  const rooms: Room[] = [
    {
      id: "1",
      name: "general",
      description: "Company-wide discussions",
      isPrivate: false,
      members: 127,
      unread: 3,
      isActive: true,
      activity: "high",
    },
    {
      id: "2",
      name: "engineering",
      description: "Engineering updates",
      isPrivate: false,
      members: 45,
      unread: 12,
      isActive: true,
      activity: "high",
    },
    {
      id: "3",
      name: "leadership",
      description: "Leadership private discussions",
      isPrivate: true,
      members: 8,
      isActive: true,
      activity: "low",
    },
  ];

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.iconBox}>
        {item.isPrivate ? (
          <Lock size={20} color="#7c3aed" />
        ) : (
          <Hash size={20} color="#2563eb" />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.roomName}>
            {item.isPrivate ? "" : "#"}
            {item.name}
          </Text>

          {item.unread && item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.metaRow}>
          <Users size={14} color="#777" />
          <Text style={styles.metaText}>{item.members}</Text>

          {item.activity && (
            <>
              <TrendingUp size={14} color="#777" />
              <Text style={styles.metaText}>
                {item.activity}
              </Text>
            </>
          )}
        </View>
      </View>

      <ChevronRight size={18} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rooms</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Plus size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color="#999" />
        <TextInput
          placeholder="Search rooms..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1 }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Create Room CTA */}
      <TouchableOpacity style={styles.cta}>
        <Plus size={20} color="#2563eb" />
        <Text style={styles.ctaText}>
          Create New Room
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  title: { fontSize: 22, fontWeight: "700" },

  createBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 8,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  roomName: {
    fontWeight: "600",
    fontSize: 15,
  },

  desc: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  metaText: {
    fontSize: 11,
    color: "#777",
    marginRight: 8,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badge: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  ctaText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});