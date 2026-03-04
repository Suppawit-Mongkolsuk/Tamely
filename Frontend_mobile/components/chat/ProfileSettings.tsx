import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface ProfileSettingsProps {
  onBack: () => void;
  onMessageDemo?: () => void;
}

export const ProfileSettings = ({
  onBack,
  onMessageDemo,
}: ProfileSettingsProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [mentionEnabled, setMentionEnabled] = useState(true);
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>YO</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Your Name</Text>
            <Text style={styles.email}>your.email@company.com</Text>
            <Text style={styles.status}>Active now</Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#9CA3AF"
          />
        </View>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            value={pushEnabled}
            onToggle={setPushEnabled}
          />
          <Divider />
          <SettingRow
            icon="chatbubble-outline"
            label="Direct Messages"
            value={dmEnabled}
            onToggle={setDmEnabled}
          />
          <Divider />
          <SettingRow
            icon="at-outline"
            label="Mentions & Replies"
            value={mentionEnabled}
            onToggle={setMentionEnabled}
          />
        </Section>

        {/* AI SETTINGS */}
        <Section title="AI Assistant">
          <SettingRow
            icon="sparkles-outline"
            label="Auto-Summarize"
            value={autoSummarize}
            onToggle={setAutoSummarize}
          />
          <Divider />
          <SettingRow
            icon="bulb-outline"
            label="Smart Suggestions"
            value={smartSuggestions}
            onToggle={setSmartSuggestions}
          />
        </Section>

        {/* APPEARANCE */}
        <Section title="Appearance">
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            value={darkMode}
            onToggle={setDarkMode}
          />
        </Section>

        {/* HELP */}
        <Section title="Help & Support">
          <NavRow
            icon="help-circle-outline"
            label="Help Center"
          />
          {onMessageDemo && (
            <>
              <Divider />
              <NavRow
                icon="flask-outline"
                label="Message Action Demo"
                onPress={onMessageDemo}
              />
            </>
          )}
        </Section>

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOut}>
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#DC2626"
          />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

/* ---------------- COMPONENTS ---------------- */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginTop: 24 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBox}>{children}</View>
  </View>
);

const SettingRow = ({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: any;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={18} color="#2563EB" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch value={value} onValueChange={onToggle} />
  </View>
);

const NavRow = ({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={18} color="#6B7280" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={18}
      color="#9CA3AF"
    />
  </TouchableOpacity>
);

const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#E5E7EB" }} />
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  name: {
    fontWeight: "600",
  },
  email: {
    fontSize: 12,
    color: "#6B7280",
  },
  status: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    marginLeft: 10,
    fontSize: 14,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    padding: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
  },
  signOutText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#DC2626",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
});