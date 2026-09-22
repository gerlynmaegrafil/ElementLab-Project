import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  barangays as fetchBarangays,
  cities as fetchCities,
  provinces as fetchProvinces,
  regions as fetchRegions,
} from "select-philippines-address";

import AddressSelect, { AddressOption } from "@/components/AddressSelect";
import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function RegisterStudentScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [allProvinces, setAllProvinces] = useState<AddressOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  const [selectedProvince, setSelectedProvince] =
    useState<AddressOption | null>(null);
  const [availableCities, setAvailableCities] = useState<AddressOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [selectedCity, setSelectedCity] = useState<AddressOption | null>(
    null
  );
  const [availableBarangays, setAvailableBarangays] = useState<AddressOption[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const [selectedBarangay, setSelectedBarangay] =
    useState<AddressOption | null>(null);

  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("Philippines");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sectionCode, setSectionCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const allRegions = await fetchRegions();
        const provincesByRegion = await Promise.all(
          allRegions.map((r: any) => fetchProvinces(r.region_code))
        );
        const flattened: AddressOption[] = provincesByRegion
          .flat()
          .map((p: any) => ({ code: p.province_code, label: p.province_name }));
        flattened.sort((a, b) => a.label.localeCompare(b.label));
        setAllProvinces(flattened);
      } catch (e) {
        console.error("Failed to load provinces", e);
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  const handleSelectProvince = async (option: AddressOption) => {
    setSelectedProvince(option);
    setSelectedCity(null);
    setSelectedBarangay(null);
    setAvailableCities([]);
    setAvailableBarangays([]);
    setLoadingCities(true);
    try {
      const result = await fetchCities(option.code);
      const mapped: AddressOption[] = result
        .map((c: any) => ({ code: c.city_code, label: c.city_name }))
        .sort((a: AddressOption, b: AddressOption) =>
          a.label.localeCompare(b.label)
        );
      setAvailableCities(mapped);
    } catch (e) {
      console.error("Failed to load cities", e);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSelectCity = async (option: AddressOption) => {
    setSelectedCity(option);
    setSelectedBarangay(null);
    setAvailableBarangays([]);
    setLoadingBarangays(true);
    try {
      const result = await fetchBarangays(option.code);
      const mapped: AddressOption[] = result
        .map((b: any) => ({ code: b.brgy_code, label: b.brgy_name }))
        .sort((a: AddressOption, b: AddressOption) =>
          a.label.localeCompare(b.label)
        );
      setAvailableBarangays(mapped);
    } catch (e) {
      console.error("Failed to load barangays", e);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setBirthdate(selectedDate);
  };

  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter your name.");
      return false;
    }
    if (!selectedProvince || !selectedCity || !selectedBarangay) {
      Alert.alert("Missing info", "Please complete your address.");
      return false;
    }
    if (!street.trim() || !zipCode.trim()) {
      Alert.alert("Missing info", "Please enter your street and zip code.");
      return false;
    }
    if (!sectionCode.trim()) {
      Alert.alert(
        "Missing section code",
        "Ask your teacher for the section code and enter it below."
      );
      return false;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert("Missing info", "Username must be at least 3 characters.");
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert("Missing info", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter your password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthdate: birthdate.toISOString(),
          address: {
            street: street.trim(),
            barangay: selectedBarangay!.label,
            city: selectedCity!.label,
            province: selectedProvince!.label,
            zipCode: zipCode.trim(),
            country: country.trim(),
          },
          username: username.trim(),
          password,
          role: "student",
          sectionCode: sectionCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      await saveSession(data.token, data.user);
      Alert.alert("Welcome!", "Your account has been created.", [
        { text: "Continue", onPress: () => router.replace("/home") },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Could not register",
        err.message === "Network request failed"
          ? "Couldn't reach the server. Make sure the backend is running."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (fieldName: string) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
  ];
  const focusHandlers = (fieldName: string) => ({
    onFocus: () => setFocusedField(fieldName),
    onBlur: () => setFocusedField(null),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.header}>Student Registration</Text>
            <Text style={styles.subheader}>
              You'll need a section code from your teacher.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Class</Text>

            <Text style={styles.label}>Section Code</Text>
            <TextInput
              style={[inputStyle("sectionCode"), styles.codeInput]}
              placeholder="e.g. A1B2C3"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              value={sectionCode}
              onChangeText={setSectionCode}
              maxLength={6}
              {...focusHandlers("sectionCode")}
            />

            <Text style={styles.sectionHeader}>Account</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={inputStyle("username")}
              placeholder="your_username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              {...focusHandlers("username")}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={inputStyle("password")}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              {...focusHandlers("password")}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={inputStyle("confirmPassword")}
              placeholder="Re-enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              {...focusHandlers("confirmPassword")}
            />

            <Text style={styles.sectionHeader}>Personal Info</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={inputStyle("name")}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              {...focusHandlers("name")}
            />

            <Text style={styles.label}>Birthday</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>{formatDate(birthdate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthdate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                maximumDate={new Date()}
                onChange={onChangeDate}
              />
            )}

            <Text style={styles.sectionHeader}>Address</Text>

            <AddressSelect
              label="Province"
              placeholder="Select a province"
              loadingLabel="Loading provinces..."
              value={selectedProvince}
              options={allProvinces}
              loading={loadingProvinces}
              onSelect={handleSelectProvince}
            />

            <AddressSelect
              label="City / Municipality"
              placeholder={
                selectedProvince
                  ? "Select a city or municipality"
                  : "Select a province first"
              }
              loadingLabel="Loading cities..."
              value={selectedCity}
              options={availableCities}
              disabled={!selectedProvince}
              loading={loadingCities}
              onSelect={handleSelectCity}
            />

            <AddressSelect
              label="Barangay"
              placeholder={selectedCity ? "Select a barangay" : "Select a city first"}
              loadingLabel="Loading barangays..."
              value={selectedBarangay}
              options={availableBarangays}
              disabled={!selectedCity}
              loading={loadingBarangays}
              onSelect={setSelectedBarangay}
            />

            <Text style={styles.label}>Street / House No.</Text>
            <TextInput
              style={inputStyle("street")}
              placeholder="123 Rizal St."
              placeholderTextColor={Colors.textMuted}
              value={street}
              onChangeText={setStreet}
              {...focusHandlers("street")}
            />

            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={inputStyle("zipCode")}
              placeholder="1870"
              placeholderTextColor={Colors.textMuted}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              {...focusHandlers("zipCode")}
            />

            <Text style={styles.label}>Country</Text>
            <TextInput
              style={inputStyle("country")}
              value={country}
              onChangeText={setCountry}
              {...focusHandlers("country")}
            />

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace("/")}
              disabled={submitting}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkTextBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  logo: { width: 64, height: 64, marginBottom: 10 },
  header: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  subheader: { color: Colors.textSecondary, fontSize: 14, textAlign: "center" },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.cyan,
    marginBottom: 14,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    justifyContent: "center",
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    color: Colors.cyan,
  },
  inputFocused: {
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  inputText: { color: Colors.textPrimary, fontSize: 15 },
  button: {
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.background, fontWeight: "800", fontSize: 16 },
  linkButton: { marginTop: 18, alignItems: "center" },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkTextBold: { color: Colors.cyan, fontWeight: "700" },
});