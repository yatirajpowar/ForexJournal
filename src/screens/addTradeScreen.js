import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addTrade, updateTrade } from '../database';

export default function AddTradeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const isEdit = route.params?.edit;
  const tradeToEdit = route.params?.trade;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  
  const [entryTime, setEntryTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  
  const [pair, setPair] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [target, setTarget] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [pnl, setPnl] = useState('');
  const [pnlType, setPnlType] = useState('PROFIT');
  const [action, setAction] = useState('BUY');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEdit && tradeToEdit) {
      const [year, month, day] = tradeToEdit.date.split('-');
      setDate(new Date(year, month - 1, day));
      setDateSelected(true);
      
      if (tradeToEdit.entry_time) {
        const [hours, minutes] = tradeToEdit.entry_time.split(':');
        const timeDate = new Date();
        timeDate.setHours(hours, minutes);
        setEntryTime(timeDate);
        setTimeSelected(true);
      }
      
      setPair(tradeToEdit.pair);
      setEntryPrice(tradeToEdit.entry_price.toString());
      setTarget(tradeToEdit.target.toString());
      setStopLoss(tradeToEdit.stop_loss.toString());
      setPnl(Math.abs(tradeToEdit.pnl).toString());
      setPnlType(tradeToEdit.pnl >= 0 ? 'PROFIT' : 'LOSS');
      setAction(tradeToEdit.action);
      setNotes(tradeToEdit.notes || '');
    }
  }, [isEdit, tradeToEdit]);

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setEntryTime(selectedTime);
      setTimeSelected(true);
    }
    setShowTimePicker(false);
  };

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (t) => {
    const hours = t.getHours();
    const minutes = String(t.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
  };

  const formatTimeForDB = (t) => {
    const hours = String(t.getHours()).padStart(2, '0');
    const minutes = String(t.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSave = () => {
    // Validation check
    if (!dateSelected) {
      Alert.alert('⚠️ Missing Date', 'Please select a date for your trade.');
      return;
    }

    if (!timeSelected) {
      Alert.alert('⚠️ Missing Time', 'Please select entry time for your trade.');
      return;
    }

    if (!pair.trim()) {
      Alert.alert('⚠️ Missing Pair', 'Please enter a currency pair (e.g., EUR/USD).');
      return;
    }

    if (!entryPrice.trim()) {
      Alert.alert('⚠️ Missing Entry Price', 'Please enter the entry price.');
      return;
    }

    if (!target.trim()) {
      Alert.alert('⚠️ Missing Target', 'Please enter target price.');
      return;
    }

    if (!stopLoss.trim()) {
      Alert.alert('⚠️ Missing Stop Loss', 'Please enter stop loss price.');
      return;
    }

    if (!pnl.trim()) {
      Alert.alert('⚠️ Missing P/L Amount', 'Please enter profit/loss amount.');
      return;
    }

    const trade = {
      date: formatDate(date),
      entry_time: formatTimeForDB(entryTime),
      pair: pair.toUpperCase(),
      entry_price: parseFloat(entryPrice),
      target: parseFloat(target),
      stop_loss: parseFloat(stopLoss),
      pnl: pnlType === 'LOSS' ? -parseFloat(pnl) : parseFloat(pnl),
      action,
      notes,
    };

    try {
      if (isEdit) {
        updateTrade(tradeToEdit.id, trade);
        Alert.alert('✅ Success', 'Trade updated successfully!');
        navigation.goBack();
      } else {
        addTrade(trade);
        Alert.alert('✅ Success', 'Trade saved successfully!');
        // Clear the form
        setDate(new Date());
        setDateSelected(false);
        setEntryTime(new Date());
        setTimeSelected(false);
        setPair('');
        setEntryPrice('');
        setTarget('');
        setStopLoss('');
        setPnl('');
        setPnlType('PROFIT');
        setAction('BUY');
        setNotes('');
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Could not save trade. Try again.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEdit ? '✏️ Edit Trade' : '📝 New Trade'}</Text>
        <Text style={styles.headerSubtitle}>Enter your trade details</Text>
      </View>

      {/* Date & Time Row */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Date & Time</Text>
        
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>Date</Text>
          <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>Entry Time</Text>
          <Text style={styles.dateTimeValue}>{formatTime(entryTime)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={entryTime}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
            is24Hour={false}
          />
        )}
      </View>

      {/* Pair & Action */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💱 Currency Pair</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. EUR/USD"
          value={pair}
          onChangeText={setPair}
          autoCapitalize="characters"
          placeholderTextColor="#99aab5"
        />

        <Text style={styles.sectionTitle}>🔼🔽 Action</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, action === 'BUY' && styles.buyActive]}
            onPress={() => setAction('BUY')}
          >
            <Text style={[styles.toggleText, action === 'BUY' && styles.toggleTextActive]}>
              🔼 BUY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, action === 'SELL' && styles.sellActive]}
            onPress={() => setAction('SELL')}
          >
            <Text style={[styles.toggleText, action === 'SELL' && styles.toggleTextActive]}>
              🔽 SELL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Price Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Entry Price"
          value={entryPrice}
          onChangeText={setEntryPrice}
          keyboardType="decimal-pad"
          placeholderTextColor="#99aab5"
        />

        <TextInput
          style={styles.input}
          placeholder="Target Price (TP)"
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholderTextColor="#99aab5"
        />

        <TextInput
          style={styles.input}
          placeholder="Stop Loss (SL)"
          value={stopLoss}
          onChangeText={setStopLoss}
          keyboardType="decimal-pad"
          placeholderTextColor="#99aab5"
        />
      </View>

      {/* P/L Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Profit/Loss</Text>
        <View style={styles.pnlContainer}>
          <TextInput
            style={[styles.input, styles.pnlInput]}
            placeholder="Amount (without +/-)"
            value={pnl}
            onChangeText={setPnl}
            keyboardType="decimal-pad"
            placeholderTextColor="#99aab5"
          />
          <View style={styles.pnlToggleRow}>
            <TouchableOpacity
              style={[styles.pnlToggleBtn, pnlType === 'PROFIT' && styles.profitActive]}
              onPress={() => setPnlType('PROFIT')}
            >
              <Text style={[styles.pnlToggleText, pnlType === 'PROFIT' && styles.pnlToggleTextActive]}>
                💹 PROFIT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pnlToggleBtn, pnlType === 'LOSS' && styles.lossActive]}
              onPress={() => setPnlType('LOSS')}
            >
              <Text style={[styles.pnlToggleText, pnlType === 'LOSS' && styles.pnlToggleTextActive]}>
                📉 LOSS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="e.g. Strong momentum, NFP impact"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor="#99aab5"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{isEdit ? '💾 Update Trade' : '💾 Save Trade'}</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#1e3a5f',
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00d4ff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#b0c4de',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef7',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#00d4ff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#1e3a5f',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#00d4ff',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e3a5f',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  buyActive: {
    backgroundColor: '#e6f9ff',
    borderColor: '#00d4ff',
  },
  sellActive: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ff4444',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  toggleTextActive: {
    color: '#1e3a5f',
  },
  pnlContainer: {
    marginBottom: 10,
  },
  pnlInput: {
    marginBottom: 10,
  },
  pnlToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pnlToggleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  profitActive: {
    backgroundColor: '#e6ffe6',
    borderColor: '#2ecc71',
    elevation: 3,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  lossActive: {
    backgroundColor: '#ffe6e6',
    borderColor: '#e74c3c',
    elevation: 3,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pnlToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  pnlToggleTextActive: {
    color: '#1e3a5f',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#00d4ff',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#1e3a5f',
    fontSize: 16,
    fontWeight: '800',
  },
});