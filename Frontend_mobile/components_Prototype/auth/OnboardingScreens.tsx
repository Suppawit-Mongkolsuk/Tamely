import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OnboardingScreensProps {
  onComplete: () => void;
  onSkip: () => void;
}

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "sparkles",
    title: "Meet your AI Assistant",
    description:
      "Get intelligent summaries and insights from every conversation automatically.",
  },
  {
    icon: "chatbubble-ellipses",
    title: "Smart Conversations",
    description:
      "AI highlights decisions, tracks tasks, and keeps everyone aligned.",
  },
  {
    icon: "flash",
    title: "Instant Insights",
    description:
      "Ask questions about messages and search using natural language.",
  },
  {
    icon: "shield-checkmark",
    title: "Secure & Private",
    description:
      "Enterprise-grade security keeps your conversations protected.",
  },
];

export default function OnboardingScreens({
  onComplete,
  onSkip,
}: OnboardingScreensProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: width * (currentSlide + 1),
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      scrollRef.current?.scrollTo({
        x: width * (currentSlide - 1),
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setCurrentSlide(index);
        }}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={styles.iconBox}>
              <Ionicons
                name={slide.icon as any}
                size={60}
                color="#fff"
              />
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {currentSlide > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handlePrev}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {currentSlide === slides.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  skipBtn: {
    alignSelf: "flex-end",
    marginTop: 50,
    marginRight: 20,
  },
  skipText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    color: "#6B7280",
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#2563EB",
  },
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    marginRight: 10,
  },
  backText: {
    color: "#374151",
    fontWeight: "600",
  },
  nextBtn: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
    marginRight: 6,
  },
});