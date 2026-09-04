import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Point this at your backend. If testing on a physical device / Expo Go,
// use your computer's LAN IP instead of localhost (e.g. http://192.168.1.5:3000).
const API_BASE_URL = 'http://localhost:3000';

export default function RegistrationScreen() {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Philippines');

  const [submitting, setSubmitting] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS keeps the picker open inline
    if (selectedDate) {
      setBirthdate(selectedDate);
    }
  };

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter your name.');
      return false;
    }
    if (!street.trim() || !city.trim()) {
      Alert.alert('Missing info', 'Please enter at least a street and city.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          birthdate: birthdate.toISOString(),
          address: {
            street: street.trim(),
            city: city.trim(),
            province: province.trim(),
            zipCode: zipCode.trim(),
            country: country.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      Alert.alert('Success', 'You have been registered!');
      // Reset form
      setName('');
      setBirthdate(new Date(2000, 0, 1));
      setStreet('');
      setCity('');
      setProvince('');
      setZipCode('');
      setCountry('Philippines');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>User Registration</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Juan Dela Cruz"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Birthdate</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{formatDate(birthdate)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthdate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.sectionHeader}>Address</Text>

      <Text style={styles.label}>Street</Text>
      <TextInput
        style={styles.input}
        placeholder="123 Rizal St."
        value={street}
        onChangeText={setStreet}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="Antipolo"
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>Province</Text>
      <TextInput
        style={styles.input}
        placeholder="Rizal"
        value={province}
        onChangeText={setProvince}
      />

      <Text style={styles.label}>Zip Code</Text>
      <TextInput
        style={styles.input}
        placeholder="1870"
        value={zipCode}
        onChangeText={setZipCode}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Country</Text>
      <TextInput
        style={styles.input}
        value={country}
        onChangeText={setCountry}
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
