import { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StarRating from './StarRating';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addRating } from '@/services/ratingsApi';

export default function RatingModal({ visible, onClose, rideId, driverId }: { visible: boolean; onClose: () => void; rideId: string; driverId: string }) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (stars < 1) {
      Alert.alert('Validation', 'Please select at least 1 star');
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('campool_token');
      if (!token) throw new Error('Not authenticated');
      await addRating(token, { rideId, driverId, rating: stars, review: review.trim() || undefined });
      Alert.alert('Thank you', 'Your rating was submitted');
      setStars(0);
      setReview('');
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to submit rating';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Rate your driver</Text>
          <StarRating value={stars} onChange={setStars} />
          <TextInput
            placeholder="Write a short review (optional)"
            multiline
            style={styles.input}
            maxLength={300}
            value={review}
            onChangeText={setReview}
          />
          <TouchableOpacity onPress={submit} disabled={loading} style={{ width: '100%' }}>
            <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Rating'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  content: { width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  input: { width: '100%', minHeight: 80, borderWidth: 1, borderColor: '#cce3de', borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  button: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
}); 