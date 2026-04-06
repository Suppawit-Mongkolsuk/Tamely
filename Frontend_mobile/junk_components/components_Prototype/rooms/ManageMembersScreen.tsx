import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Shield,
  UserX,
  ChevronDown,
  Search,
} from "lucide-react-native";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member";
  isOnline: boolean;
}

interface Props {
  roomName: string;
  onBack: () => void;
}

export default function ManageMembersScreen({
  roomName,
  onBack,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah@company.com", role: "Admin", isOnline: true },
    { id: "2", name: "Mike Chen", email: "mike@company.com", role: "Admin", isOnline: true },
    { id: "3", name: "Emma Wilson", email: "emma@company.com", role: "Member", isOnline: false },
    { id: "4", name: "Alex Martinez", email: "alex@company.com", role: "Member", isOnline: true },
  ]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const changeRole = (id: string, role: "Admin" | "Member") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role } : m))
    );
    setRoleMenuFor(null);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMember(null);
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.split(" ").map((n) => n[0]).join("")}
        </Text>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      <View style={styles.actions}>
        {/* Role */}
        <TouchableOpacity
          style={styles.roleBtn}
          onPress={() =>
            setRoleMenuFor(roleMenuFor === item.id ? null : item.id)
          }
        >
          {item.role === "Admin" && (
            <Shield size={14} color="#333" />
          )}
          <Text style={styles.roleText}>{item.role}</Text>
          <ChevronDown size={14} color="#777" />
        </TouchableOpacity>

        {/* Remove */}
        <TouchableOpacity
          onPress={() => setSelectedMember(item)}
        >
          <UserX size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Role Menu */}
      {roleMenuFor === item.id && (
        <View style={styles.roleMenu}>
          <TouchableOpacity
            onPress={() => changeRole(item.id, "Admin")}
          >
            <Text style={styles.menuItem}>Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeRole(item.id, "Member")}
          >
            <Text style={styles.menuItem}>Member</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Manage Members</Text>
          <Text style={styles.subtitle}>#{roomName}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color="#999" />
        <TextInput
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1 }}
        />
      </View>

      {/* Members List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Remove Modal */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Remove Member?
            </Text>
            <Text style={styles.modalText}>
              {selectedMember?.name} will lose access.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedMember(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() =>
                  selectedMember &&
                  removeMember(selectedMember.id)
                }
              >
                <Text style={{ color: "#fff" }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  title: { fontSize: 18, fontWeight: "600" },
  subtitle: { fontSize: 12, color: "#666" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  avatarText: { fontWeight: "600", color: "#2563eb" },

  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: { fontWeight: "600" },
  email: { fontSize: 12, color: "#777" },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },

  roleText: { fontSize: 12 },

  roleMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
  },

  menuItem: { paddingVertical: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "80%",
  },

  modalTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  modalText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cancelBtn: {
    flex: 1,
    padding: 10,
    marginRight: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
  },

  removeBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    alignItems: "center",
  },
});
