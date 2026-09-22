import { Colors } from "@/constants/theme-colors";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

type Props = {
  placeholder: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function PickerField({
  placeholder,
  value,
  onPress,
  disabled,
  loading,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.input, disabled && styles.inputDisabled]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.cyan} />
      ) : (
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    justifyContent: "center",
    backgroundColor: Colors.inputBackground,
  },
  inputDisabled: { opacity: 0.5 },
  valueText: { color: Colors.textPrimary, fontSize: 15 },
  placeholderText: { color: Colors.textMuted, fontSize: 15 },
});
