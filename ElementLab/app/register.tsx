import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PickerField from "@/components/PickerField";
import SelectModal, { SelectOption } from "@/components/SelectModal";
import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { isPasswordStrongEnough } from "@/lib/password";
import {
  CityMuni,
  PSGCOption,
  citiesForProvince,
  fetchBarangays,
  fetchCitiesMunicipalities,
  fetchProvinces,
  fetchRegions,
  independentCitiesForRegion,
  provincesForRegion,
} from "@/lib/psgc";
import { saveSession } from "@/lib/session";

// Add more entries here later to support other countries.
// When the selected country isn't "Philippines", the form falls back
// to plain free-text province/city/barangay fields automatically.
const COUNTRIES: SelectOption[] = [{ code: "PH", name: "Philippines" }];
const NCR_CODE = "1300000000";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // --- Country ---
  const [country, setCountry] = useState("Philippines");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const isPH = country === "Philippines";

  // --- Common fields ---
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");

  // --- Non-PH fallback fields (plain text, ready for other countries) ---
  const [genericCity, setGenericCity] = useState("");
  const [genericProvince, setGenericProvince] = useState("");

  // --- PH cascading address data ---
  const [loadingAddressData, setLoadingAddressData] = useState(false);
  const [regions, setRegions] = useState<PSGCOption[]>([]);
  const [allProvinces, setAllProvinces] = useState<PSGCOption[]>([]);
  const [allCitiesMunis, setAllCitiesMunis] = useState<CityMuni[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<PSGCOption | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<PSGCOption | null>(
    null,
  );
  const [noProvinceMode, setNoProvinceMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityMuni | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<PSGCOption | null>(
    null,
  );

  const [barangayOptions, setBarangayOptions] = useState<PSGCOption[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);

  // Load PH reference data once
  useEffect(() => {
    if (!isPH) return;
    let alive = true;
    setLoadingAddressData(true);
    Promise.all([fetchRegions(), fetchProvinces(), fetchCitiesMunicipalities()])
      .then(([r, p, cm]) => {
        if (!alive) return;
        setRegions(r);
        setAllProvinces(p);
        setAllCitiesMunis(cm);
      })
      .catch(() => {
        if (alive) {
          Alert.alert(
            "Connection issue",
            "Couldn't load Philippine address data. Check your internet connection, then try again.",
          );
        }
      })
      .finally(() => {
        if (alive) setLoadingAddressData(false);
      });
    return () => {
      alive = false;
    };
  }, [isPH]);

  const provinceOptions = useMemo(() => {
    if (!selectedRegion) return [];
    return provincesForRegion(allProvinces, selectedRegion.code);
  }, [allProvinces, selectedRegion]);

  const independentCities = useMemo(() => {
    if (!selectedRegion) return [];
    return independentCitiesForRegion(
      allCitiesMunis,
      allProvinces,
      selectedRegion.code,
    );
  }, [allCitiesMunis, allProvinces, selectedRegion]);

  // Auto-skip the province step for regions with no provinces (e.g. NCR)
  useEffect(() => {
    if (
      selectedRegion &&
      allProvinces.length > 0 &&
      provinceOptions.length === 0
    ) {
      setNoProvinceMode(true);
    }
  }, [selectedRegion, allProvinces.length, provinceOptions.length]);

  const cityOptions = useMemo(() => {
    if (noProvinceMode) return independentCities;
    if (!selectedProvince) return [];
    return citiesForProvince(allCitiesMunis, selectedProvince.code);
  }, [allCitiesMunis, selectedProvince, noProvinceMode, independentCities]);

  const provinceModalOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = provinceOptions.map((p) => ({
      code: p.code,
      name: p.name,
    }));
    if (independentCities.length > 0) {
      opts.push({
        code: "__NO_PROVINCE__",
        name: "Independent / Highly Urbanized City (no province)",
      });
    }
    return opts;
  }, [provinceOptions, independentCities]);

  const cityModalOptions: SelectOption[] = useMemo(
    () =>
      cityOptions.map((c) => ({
        code: c.code,
        name: c.name,
        subtitle: c.type === "City" ? "City" : "Municipality",
      })),
    [cityOptions],
  );

  const provinceDisplayValue = () => {
    if (!selectedRegion) return "";
    if (noProvinceMode) {
      return selectedRegion.code === NCR_CODE
        ? "Metro Manila (no province)"
        : "Independent / Highly Urbanized City";
    }
    return selectedProvince?.name ?? "";
  };

  const handleSelectRegion = (opt: SelectOption) => {
    setSelectedRegion({ code: opt.code, name: opt.name });
    setSelectedProvince(null);
    setNoProvinceMode(false);
    setSelectedCity(null);
    setZipCode("");
    setSelectedBarangay(null);
    setBarangayOptions([]);
    setShowRegionModal(false);
  };

  const handleSelectProvince = (opt: SelectOption) => {
    if (opt.code === "__NO_PROVINCE__") {
      setNoProvinceMode(true);
      setSelectedProvince(null);
    } else {
      setNoProvinceMode(false);
      setSelectedProvince({ code: opt.code, name: opt.name });
    }
    setSelectedCity(null);
    setZipCode("");
    setSelectedBarangay(null);
    setBarangayOptions([]);
    setShowProvinceModal(false);
  };

  const handleSelectCity = (opt: SelectOption) => {
    const city = cityOptions.find((c) => c.code === opt.code) ?? null;
    setSelectedCity(city);
    setSelectedBarangay(null);
    setBarangayOptions([]);
    if (city?.zip_code) setZipCode(city.zip_code);
    setShowCityModal(false);

    if (city) {
      setLoadingBarangays(true);
      fetchBarangays(city.code)
        .then(setBarangayOptions)
        .catch(() =>
          Alert.alert(
            "Connection issue",
            "Couldn't load barangays for this city/municipality.",
          ),
        )
        .finally(() => setLoadingBarangays(false));
    }
  };

  const handleSelectBarangay = (opt: SelectOption) => {
    setSelectedBarangay({ code: opt.code, name: opt.name });
    setShowBarangayModal(false);
  };

  const handleSelectCountry = (opt: SelectOption) => {
    setCountry(opt.name);
    setShowCountryModal(false);
    // Reset address state when switching countries
    setSelectedRegion(null);
    setSelectedProvince(null);
    setNoProvinceMode(false);
    setSelectedCity(null);
    setSelectedBarangay(null);
    setBarangayOptions([]);
    setGenericCity("");
    setGenericProvince("");
    setStreet("");
    setZipCode("");
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

    if (!street.trim()) {
      Alert.alert("Missing info", "Please enter your street address.");
      return false;
    }

    if (isPH) {
      if (!selectedRegion) {
        Alert.alert("Missing info", "Please select a region.");
        return false;
      }
      if (!noProvinceMode && !selectedProvince) {
        Alert.alert("Missing info", "Please select a province.");
        return false;
      }
      if (!selectedCity) {
        Alert.alert("Missing info", "Please select a city or municipality.");
        return false;
      }
      if (!selectedBarangay) {
        Alert.alert("Missing info", "Please select a barangay.");
        return false;
      }
      if (!/^\d{4}$/.test(zipCode.trim())) {
        Alert.alert("Missing info", "Please enter a valid 4-digit ZIP code.");
        return false;
      }
    } else {
      if (!genericCity.trim()) {
        Alert.alert("Missing info", "Please enter your city.");
        return false;
      }
      if (!zipCode.trim()) {
        Alert.alert("Missing info", "Please enter your ZIP/postal code.");
        return false;
      }
    }

    if (!username.trim() || username.trim().length < 3) {
      Alert.alert("Missing info", "Username must be at least 3 characters.");
      return false;
    }
    if (!isPasswordStrongEnough(password)) {
      Alert.alert(
        "Weak password",
        "Your password must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.",
      );
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

    const address = isPH
      ? {
          street: street.trim(),
          region: selectedRegion?.name ?? "",
          province: noProvinceMode ? "" : (selectedProvince?.name ?? ""),
          city: selectedCity?.name ?? "",
          barangay: selectedBarangay?.name ?? "",
          zipCode: zipCode.trim(),
          country,
        }
      : {
          street: street.trim(),
          city: genericCity.trim(),
          province: genericProvince.trim(),
          zipCode: zipCode.trim(),
          country: country.trim(),
        };

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthdate: birthdate.toISOString(),
          address,
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      await saveSession(data.token, data.user);
      Alert.alert("Welcome!", "Your account has been created.", [
        { text: "Continue", onPress: () => router.replace("/home") },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Could not register",
        err.message === "Network request failed"
          ? "Couldn't reach the server. Make sure the backend is running and API_BASE_URL in lib/api.ts is correct."
          : err.message,
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
              source={require("@/assets/images/logo-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.header}>Create your account</Text>
            <Text style={styles.subheader}>
              Tell us a bit about yourself to get started.
            </Text>
          </View>

          <View style={styles.card}>
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
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              {...focusHandlers("password")}
            />
            <PasswordStrengthMeter password={password} />

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

            <Text style={styles.label}>Country</Text>
            <PickerField
              placeholder="Select country"
              value={country}
              onPress={() => setShowCountryModal(true)}
            />

            <Text style={styles.label}>Street</Text>
            <TextInput
              style={inputStyle("street")}
              placeholder="123 Rizal St."
              placeholderTextColor={Colors.textMuted}
              value={street}
              onChangeText={setStreet}
              {...focusHandlers("street")}
            />

            {isPH ? (
              <>
                <Text style={styles.label}>Region</Text>
                <PickerField
                  placeholder="Select region"
                  value={selectedRegion?.name}
                  onPress={() => setShowRegionModal(true)}
                  loading={loadingAddressData}
                  disabled={loadingAddressData}
                />

                <Text style={styles.label}>Province</Text>
                <PickerField
                  placeholder="Select region first"
                  value={provinceDisplayValue()}
                  onPress={() => setShowProvinceModal(true)}
                  disabled={
                    !selectedRegion || provinceModalOptions.length === 0
                  }
                />

                <Text style={styles.label}>City / Municipality</Text>
                <PickerField
                  placeholder={
                    selectedRegion && (noProvinceMode || selectedProvince)
                      ? "Select city or municipality"
                      : "Select province first"
                  }
                  value={selectedCity?.name}
                  onPress={() => setShowCityModal(true)}
                  disabled={
                    !selectedRegion || (!noProvinceMode && !selectedProvince)
                  }
                />

                <Text style={styles.label}>Barangay</Text>
                <PickerField
                  placeholder={
                    selectedCity ? "Select barangay" : "Select city first"
                  }
                  value={selectedBarangay?.name}
                  onPress={() => setShowBarangayModal(true)}
                  disabled={!selectedCity}
                  loading={loadingBarangays}
                />

                <Text style={styles.label}>ZIP Code</Text>
                <TextInput
                  style={inputStyle("zipCode")}
                  placeholder="1870"
                  placeholderTextColor={Colors.textMuted}
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                  maxLength={4}
                  {...focusHandlers("zipCode")}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={inputStyle("genericCity")}
                  placeholder="City"
                  placeholderTextColor={Colors.textMuted}
                  value={genericCity}
                  onChangeText={setGenericCity}
                  {...focusHandlers("genericCity")}
                />

                <Text style={styles.label}>Province / State</Text>
                <TextInput
                  style={inputStyle("genericProvince")}
                  placeholder="Province or state"
                  placeholderTextColor={Colors.textMuted}
                  value={genericProvince}
                  onChangeText={setGenericProvince}
                  {...focusHandlers("genericProvince")}
                />

                <Text style={styles.label}>ZIP / Postal Code</Text>
                <TextInput
                  style={inputStyle("zipCode")}
                  placeholder="Postal code"
                  placeholderTextColor={Colors.textMuted}
                  value={zipCode}
                  onChangeText={setZipCode}
                  {...focusHandlers("zipCode")}
                />
              </>
            )}

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

      <SelectModal
        visible={showCountryModal}
        title="Select Country"
        options={COUNTRIES}
        onSelect={handleSelectCountry}
        onClose={() => setShowCountryModal(false)}
      />
      <SelectModal
        visible={showRegionModal}
        title="Select Region"
        options={regions}
        loading={loadingAddressData}
        onSelect={handleSelectRegion}
        onClose={() => setShowRegionModal(false)}
      />
      <SelectModal
        visible={showProvinceModal}
        title="Select Province"
        options={provinceModalOptions}
        onSelect={handleSelectProvince}
        onClose={() => setShowProvinceModal(false)}
      />
      <SelectModal
        visible={showCityModal}
        title="Select City / Municipality"
        options={cityModalOptions}
        onSelect={handleSelectCity}
        onClose={() => setShowCityModal(false)}
      />
      <SelectModal
        visible={showBarangayModal}
        title="Select Barangay"
        options={barangayOptions}
        loading={loadingBarangays}
        onSelect={handleSelectBarangay}
        onClose={() => setShowBarangayModal(false)}
      />
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
