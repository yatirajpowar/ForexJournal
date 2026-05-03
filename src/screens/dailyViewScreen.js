import { useState, useCallback } from 'react';
import {
  View, Text, SectionList,
  StyleSheet, RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getAllTrades, deleteTrade } from '../database';

function groupByDate(trades) {
  const groups = {};
  trades.forEach((trade) => {
    if (!groups[trade.date]) {
      groups[trade.date] = [];
    }
    groups[trade.date].push(trade);
  });

  return Object.keys(groups).map((date) => {
    const dailyPnl = groups[date].reduce((sum, t) => sum + t.pnl, 0);
    return {
      title: date,
      dailyPnl: dailyPnl,
      data: groups[date],
    };
  });
}

export default function DailyViewScreen() {
  const navigation = useNavigation();
  const [sections, setSections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrades = () => {
    const trades = getAllTrades();
    const grouped = groupByDate(trades);
    setSections(grouped);
  };

  useFocusEffect(
    useCallback(() => {
      loadTrades();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrades();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Trade',
      'Are you sure you want to delete this trade?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => {
          deleteTrade(id);
          loadTrades();
        } },
      ]
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionDate}>📅 {section.title}</Text>
        <Text style={styles.tradeCount}>
          {section.data.length} {section.data.length === 1 ? 'Trade' : 'Trades'}
        </Text>
      </View>
      <View style={[
        styles.dailyPnlBox,
        section.dailyPnl >= 0 ? styles.profitBox : styles.lossBox
      ]}>
        <Text style={[
          styles.sectionPnl,
          section.dailyPnl >= 0 ? styles.profit : styles.loss
        ]}>
          {section.dailyPnl >= 0 ? '+' : ''}${section.dailyPnl.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.tradeRow}>
      <View style={styles.tradeCard}>
        {/* Top Row: Pair + Time + Action */}
        <View style={styles.tradeHeader}>
          <View style={styles.tradeLeft}>
            <Text style={styles.tradePair}>{item.pair}</Text>
            <Text style={styles.tradeTime}>
              ⏰ {item.entry_time || '--:--'}
            </Text>
          </View>
          <View style={[
            styles.actionBadge,
            item.action === 'BUY' ? styles.buyBadge : styles.sellBadge
          ]}>
            <Text style={styles.actionText}>
              {item.action === 'BUY' ? '🔼' : '🔽'} {item.action}
            </Text>
          </View>
        </View>

        {/* Middle Row: Prices */}
        <View style={styles.pricesRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Entry</Text>
            <Text style={styles.priceValue}>{item.entry_price.toFixed(4)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>TP</Text>
            <Text style={styles.priceValue}>{item.target.toFixed(4)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>SL</Text>
            <Text style={styles.priceValue}>{item.stop_loss.toFixed(4)}</Text>
          </View>
          <View style={[
            styles.priceItem,
            {
              backgroundColor: item.pnl >= 0 ? '#1a3a1a' : '#3a1a1a',
              borderRadius: 8,
              paddingVertical: 8,
            }
          ]}>
            <Text style={styles.priceLabel}>P/L</Text>
            <Text style={[
              styles.priceValue,
              item.pnl >= 0 ? styles.profit : styles.loss
            ]}>
              {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes if available */}
        {item.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesText}>📝 {item.notes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate('AddTrade', { edit: true, trade: item })}
          >
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No trades yet.</Text>
          <Text style={styles.emptySubText}>Add your first trade from the Add tab.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00d4ff"
            />
          }
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00d4ff',
    marginBottom: 4,
  },
  tradeCount: {
    fontSize: 11,
    color: '#b0c4de',
  },
  dailyPnlBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profitBox: {
    backgroundColor: '#e6ffe6',
  },
  lossBox: {
    backgroundColor: '#ffe6e6',
  },
  sectionPnl: {
    fontSize: 14,
    fontWeight: '700',
  },
  tradeRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tradeCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e8eef7',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tradeLeft: {
    flex: 1,
  },
  tradePair: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 3,
  },
  tradeTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyBadge: {
    backgroundColor: '#e6f9ff',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  sellBadge: {
    backgroundColor: '#ffe6e6',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  pricesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  priceItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8eef7',
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 12,
    color: '#1e3a5f',
    fontWeight: '700',
  },
  notesSection: {
    backgroundColor: '#f0f4f8',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00d4ff',
    marginTop: 10,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  profit: {
    color: '#2ecc71',
  },
  loss: {
    color: '#e74c3c',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editBtn: {
    backgroundColor: '#00d4ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteBtn: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});