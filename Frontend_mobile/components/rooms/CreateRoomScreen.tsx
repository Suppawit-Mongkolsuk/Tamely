import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Hash,
  Lock,
  Sparkles,
  Plus,
  X,
  Search,
} from "lucide-react-native";

interface RoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  aiEnabled: boolean;
  members: string[];
}

interface User {
  id: string;
  name: string;
  initials: string;
  role?: string;
}

interface Props {
  onBack: () => void;
  onCreate: (data: RoomData) => void;
}

export default function CreateRoomScreen({ onBack, onCreate }: Props) {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const users: User[] = [
    { id: "1", name: "Sarah Johnson", initials: "SJ" },
    { id: "2", name: "Mike Chen", initials: "MC" },
    { id: "3", name: "Emma Wilson", initials: "EW" },
  ];

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (roomName.trim().length >= 3) {
      onCreate({
        name: roomName,
        description,
        isPrivate,
        aiEnabled,
        members: selectedMembers,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Room</Text>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={roomName.trim().length < 3}
          style={[
            styles.createBtn,
            roomName.trim().length < 3 && { opacity: 0.4 },
          ]}
        >
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Icon Preview */}
        <View style={styles.iconPreview}>
          {isPrivate ? (
            <Lock size={40} color="#7c3aed" />
          ) : (
            <Hash size={40} color="#2563eb" />
          )}
        </View>

        {/* Room Name */}
        <Text style={styles.label}>Room Name *</Text>
        <TextInput
          value={roomName}
          onChangeText={setRoomName}
          placeholder="marketing-team"
          style={styles.input}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's this room about?"
          multiline
          style={[styles.input, { height: 80 }]}
        />

        {/* Private Toggle */}
        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Private Room</Text>
            <Text style={styles.toggleDesc}>
              Only invited members can join
            </Text>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>

        {/* AI Toggle */}
        <View style={[styles.toggleCard, { backgroundColor: "#f5f3ff" }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>
              Enable AI Assistant
            </Text>
            <Text style={styles.toggleDesc}>
              AI can summarize conversations
            </Text>
          </View>
          <Switch value={aiEnabled} onValueChange={setAiEnabled} />
        </View>

        {/* Members */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Add Members</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(!showPicker)}
              style={styles.addBtn}
            >
              <Plus size={16} color="#2563eb" />
              <Text style={{ color: "#2563eb" }}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Selected */}
          {selectedMembers.map((id) => {
            const user = users.find((u) => u.id === id);
            if (!user) return null;

            return (
              <View key={id} style={styles.memberTag}>
                <Text>{user.name}</Text>
                <TouchableOpacity
                  onPress={() => toggleMember(id)}
                >
                  <X size={14} color="red" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Picker */}
          {showPicker && (
            <View style={styles.pickerBox}>
              <View style={styles.searchRow}>
                <Search size={16} color="#999" />
                <TextInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ flex: 1 }}
                />
              </View>

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userRow}
                    onPress={() => toggleMember(item.id)}
                  >
                    <Text>{item.name}</Text>
                    {selectedMembers.includes(item.id) && (
                      <Text style={{ color: "#2563eb" }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  createBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },

  createText: { color: "#fff", fontWeight: "600" },

  iconPreview: {
    alignSelf: "center",
    marginBottom: 20,
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
  },

  toggleTitle: { fontWeight: "600" },
  toggleDesc: { fontSize: 12, color: "#666" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  memberTag: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },

  pickerBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    maxHeight: 250,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
    marginBottom: 8,
  },

  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
});