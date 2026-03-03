import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Hash,
  Lock,
  Sparkles,
  Settings,
  Bell,
  BellOff,
  Pin,
  Search,
  LogOut,
  Shield,
  UserPlus,
} from "lucide-react-native";

interface Member {
  id: string;
  name: string;
  role?: string;
  isOnline: boolean;
  isAdmin?: boolean;
}

interface Props {
  roomName: string;
  roomDescription?: string;
  isPrivate: boolean;
  aiEnabled: boolean;
  isAdmin?: boolean;
  userRole?: "Admin" | "Member";
  onBack: () => void;
}

export default function RoomInfoScreen({
  roomName,
  roomDescription,
  isPrivate,
  aiEnabled,
  isAdmin = false,
  userRole,
  onBack,
}: Props) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "online" | "offline">(
    "all"
  );

  const members: Member[] = [
    { id: "1", name: "Sarah Johnson", role: "Product Manager", isOnline: true, isAdmin: true },
    { id: "2", name: "Mike Chen", role: "Engineering Lead", isOnline: true, isAdmin: true },
    { id: "3", name: "Emma Wilson", role: "UX Researcher", isOnline: false },
    { id: "4", name: "Alex Martinez", role: "Designer", isOnline: true },
  ];

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMembersByTab = () => {
    if (activeTab === "online")
      return filteredMembers.filter((m) => m.isOnline);
    if (activeTab === "offline")
      return filteredMembers.filter((m) => !m.isOnline);
    return filteredMembers;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room Info</Text>
        {isAdmin && <Settings size={22} color="#333" />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Room Header */}
        <View style={styles.roomHeader}>
          <View style={styles.iconBox}>
            {isPrivate ? (
              <Lock size={28} color="#7c3aed" />
            ) : (
              <Hash size={28} color="#2563eb" />
            )}
          </View>

          <Text style={styles.roomName}>
            {isPrivate ? "" : "#"}
            {roomName}
          </Text>

          {roomDescription && (
            <Text style={styles.roomDesc}>{roomDescription}</Text>
          )}

          {userRole && (
            <View style={styles.roleBadge}>
              {userRole === "Admin" && (
                <Shield size={12} color="#2563eb" />
              )}
              <Text style={styles.roleText}>{userRole}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn}>
            <Pin size={16} color="#555" />
            <Text>Pinned</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn}>
            <Search size={16} color="#555" />
            <Text>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Toggle */}
        <View style={styles.settingCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {notificationsEnabled ? (
              <Bell size={18} color="#333" />
            ) : (
              <BellOff size={18} color="#333" />
            )}
            <Text style={{ fontWeight: "600" }}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* AI Section */}
        {aiEnabled && (
          <View style={styles.aiCard}>
            <Sparkles size={20} color="#7c3aed" />
            <Text style={{ fontWeight: "600", marginTop: 6 }}>
              AI Active & Learning
            </Text>
            <Text style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
              Summaries and action tracking enabled
            </Text>
          </View>
        )}

        {/* Members */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>
            Members ({members.length})
          </Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {["all", "online", "offline"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.activeTab,
                ]}
              >
                <Text
                  style={{
                    color: activeTab === tab ? "#2563eb" : "#666",
                  }}
                >
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
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

          {/* Member List */}
          <FlatList
            data={getMembersByTab()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={{ color: "#2563eb", fontWeight: "600" }}>
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                  {item.isOnline && (
                    <View style={styles.onlineDot} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    {item.role}
                  </Text>
                </View>

                {item.isAdmin && (
                  <Shield size={16} color="#2563eb" />
                )}
              </View>
            )}
          />
        </View>

        {/* Leave Room */}
        <TouchableOpacity style={styles.leaveBtn}>
          <LogOut size={18} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontWeight: "600" }}>
            Leave Room
          </Text>
        </TouchableOpacity>
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

  headerTitle: { fontSize: 18, fontWeight: "600" },

  roomHeader: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  roomName: { fontSize: 20, fontWeight: "700" },
  roomDesc: { fontSize: 14, color: "#666", marginTop: 4 },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
  },

  roleText: { fontSize: 12, color: "#2563eb" },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },

  quickBtn: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },

  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  aiCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
  },

  sectionTitle: { fontWeight: "700", marginBottom: 10 },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },

  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: "#e0f2fe",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

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

  leaveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    margin: 20,
    padding: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
  },
});