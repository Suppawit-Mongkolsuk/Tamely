import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface JoinOrganizationScreenProps {
  onContinue: () => void;
}

export default function JoinOrganizationScreen({
  onContinue,
}: JoinOrganizationScreenProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [orgData, setOrgData] = useState<{
    name: string;
    members: number;
  } | null>(null);

  const handleInviteCodeChange = (value: string) => {
    const formatted = value.toUpperCase();
    setInviteCode(formatted);
    setIsValid(false);
    setOrgData(null);

    if (formatted.length >= 8) {
      validateCode(formatted);
    }
  };

  const validateCode = async (code: string) => {
    setIsValidating(true);

    setTimeout(() => {
      if (code.startsWith("TEAMLY")) {
        setIsValid(true);
        setOrgData({
          name: "Acme Corporation",
          members: 127,
        });
      } else {
        setIsValid(false);
        setOrgData(null);
      }
      setIsValidating(false);
    }, 800);
  };

  const handleContinue = () => {
    if (isValid && orgData) {
      onContinue();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.iconBox}>
        <Ionicons name="business" size={32} color="#fff" />
      </View>

      <Text style={styles.title}>Join your organization</Text>
      <Text style={styles.subtitle}>
        Enter the invite code shared by your team admin
      </Text>

      {/* Invite Code */}
      <Text style={styles.label}>Invite Code</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          value={inviteCode}
          onChangeText={handleInviteCodeChange}
          placeholder="TEAMLY-XXX"
          maxLength={10}
          style={styles.input}
          autoCapitalize="characters"
        />

        {isValidating && (
          <ActivityIndicator
            size="small"
            color="#2563EB"
            style={styles.validationIcon}
          />
        )}

        {!isValidating && isValid && (
          <View style={styles.validIcon}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        )}
      </View>

      <Text style={styles.helper}>Example: TEAMLY-ABC</Text>

      {/* Organization Preview */}
      {isValid && orgData && (
        <View style={styles.orgCard}>
          <View style={styles.orgHeader}>
            <View style={styles.orgIcon}>
              <Ionicons name="business" size={24} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.orgName}>{orgData.name}</Text>
              <Text style={styles.orgMembers}>
                {orgData.members} team members
              </Text>
            </View>

            <View style={styles.validIcon}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
          </View>

          <View style={styles.orgInfo}>
            <Ionicons name="sparkles" size={16} color="#2563EB" />
            <Text style={styles.orgInfoText}>
              You'll get access to all channels and AI-powered features
            </Text>
          </View>
        </View>
      )}

      {/* Info Card */}
      {!isValid && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Don't have an invite code?
          </Text>
          <Text style={styles.infoText}>
            Contact your organization admin to get an invitation code.
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isValid || !orgData) && { opacity: 0.5 },
        ]}
        disabled={!isValid || !orgData}
        onPress={handleContinue}
      >
        <Text style={styles.primaryButtonText}>
          Continue to Setup
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.footerText}>
        By continuing, you agree to the organization's terms and policies
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 24,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  validationIcon: {
    position: "absolute",
    right: 14,
  },
  validIcon: {
    backgroundColor: "#22C55E",
    borderRadius: 20,
    padding: 6,
    position: "absolute",
    right: 14,
  },
  helper: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  orgCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orgIcon: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  orgName: {
    fontWeight: "600",
    fontSize: 16,
  },
  orgMembers: {
    fontSize: 13,
    color: "#6B7280",
  },
  orgInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orgInfoText: {
    fontSize: 13,
    marginLeft: 6,
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerText: {
    marginTop: 30,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
});