import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const isFormValid = email.length > 0 && email.includes("@");

  if (isSubmitted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={50} color="#16a34a" />
        </View>

        <Text style={styles.title}>Check your email</Text>

        <Text style={styles.subtitle}>
          We've sent password reset instructions to:
        </Text>

        <Text style={styles.email}>{email}</Text>

        <Text style={styles.helperText}>
          Click the link in the email to reset your password. The link will
          expire in 24 hours.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
          <Text style={styles.primaryButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setIsSubmitted(false)}
        >
          <Text style={styles.linkText}>
            Didn't receive the email? Resend
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color="#374151" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we'll send you instructions to reset your password
      </Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color="#9CA3AF"
          style={styles.inputIcon}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@company.com"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isFormValid || isLoading) && { opacity: 0.5 },
        ]}
        disabled={!isFormValid || isLoading}
        onPress={handleSubmit}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      {/* Help Box */}
      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          <Text style={{ fontWeight: "bold" }}>Need help? </Text>
          If you don't have access to your email, contact your organization
          admin.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#374151",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: "#374151",
  },
  successIcon: {
    marginBottom: 20,
  },
  email: {
    color: "#2563EB",
    fontWeight: "bold",
    marginBottom: 20,
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  helpBox: {
    marginTop: 30,
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 13,
    color: "#374151",
  },
});