import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getTradesByMonth } from '../database';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export default function MonthlyViewScreen() {
  const [monthData, setMonthData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const viewShotRef = React.useRef();

  const monthString = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadMonthlyData();
  }, [currentMonth]);

  const loadMonthlyData = async () => {
    try {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const trades = await getTradesByMonth(monthKey);

      if (trades.length === 0) {
        setMonthData({
          trades: [],
          totalProfit: 0,
          totalLoss: 0,
          netPnL: 0,
          winRate: 0,
          winCount: 0,
          lossCount: 0,
        });
        return;
      }

      const totalProfit = trades
        .filter(t => t.pnl > 0)
        .reduce((sum, t) => sum + t.pnl, 0);

      const totalLoss = trades
        .filter(t => t.pnl < 0)
        .reduce((sum, t) => sum + Math.abs(t.pnl), 0);

      const winCount = trades.filter(t => t.pnl > 0).length;
      const lossCount = trades.filter(t => t.pnl < 0).length;
      const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(1) : 0;
      const netPnL = totalProfit - totalLoss;

      setMonthData({
        trades,
        totalProfit: totalProfit.toFixed(2),
        totalLoss: totalLoss.toFixed(2),
        netPnL: netPnL.toFixed(2),
        winRate,
        winCount,
        lossCount,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load monthly data');
      console.error(error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadMonthlyData();
      setRefreshing(false);
    }, 500);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const downloadSlip = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media Library permission is required');
        return;
      }

      const uri = await viewShotRef.current.capture();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('ForexJournal', asset, false);

      Alert.alert('Success', '✅ Monthly slip saved to Photos!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save slip');
      console.error(error);
    }
  };

  const shareSlip = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `ForexJournal - ${monthString}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share slip');
      console.error(error);
    }
  };

  if (!monthData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>⏳ Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Text style={styles.navText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>📅 {monthString}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ id: 'summary' }]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <>
            {/* Snapshot Area for Download */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
              <View style={styles.slipContainer}>
                <Text style={styles.slipTitle}>💰 FOREX JOURNAL</Text>
                <Text style={styles.slipMonth}>{monthString}</Text>

                {monthData.trades.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyState}>No trades this month</Text>
                  </View>
                ) : (
                  <>
                    {/* NET P/L - BIG */}
                    <View style={[
                      styles.netPnlBox,
                      monthData.netPnL >= 0 ? styles.netProfitBox : styles.netLossBox
                    ]}>
                      <Text style={styles.netPnlLabel}>NET P/L</Text>
                      <Text style={[
                        styles.netPnlValue,
                        monthData.netPnL >= 0 ? styles.profit : styles.loss
                      ]}>
                        {monthData.netPnL >= 0 ? '+' : ''}${monthData.netPnL}
                      </Text>
                    </View>

                    {/* P/L Summary - Wins & Losses */}
                    <View style={styles.summaryBox}>
                      <View style={styles.summaryRow}>
                        <View style={styles.profitItem}>
                          <Text style={styles.summaryLabel}>� Total Wins</Text>
                          <Text style={[styles.summaryValue, styles.profit]}>
                            +${monthData.totalProfit}
                          </Text>
                        </View>
                        <View style={styles.lossItem}>
                          <Text style={styles.summaryLabel}>📉 Total Losses</Text>
                          <Text style={[styles.summaryValue, styles.loss]}>
                            -${monthData.totalLoss}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Win Rate & Trade Count */}
                    <View style={styles.statsBox}>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>📊 Win Rate</Text>
                        <Text style={styles.statValue}>{monthData.winRate}%</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>📈 Trades</Text>
                        <Text style={styles.statValue}>{monthData.trades.length}</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>⚖️ W/L</Text>
                        <Text style={styles.statValue}>
                          {monthData.winCount}/{monthData.lossCount}
                        </Text>
                      </View>
                    </View>

                    {/* Trade List */}
                    <View style={styles.tradeListBox}>
                      <Text style={styles.tradeListTitle}>📋 Trade Details</Text>
                      {monthData.trades.map((trade, index) => (
                        <View key={index} style={styles.tradeRow}>
                          <View style={styles.tradeLeft}>
                            <Text style={styles.tradePair}>{trade.pair}</Text>
                            <Text style={styles.tradeAction}>
                              {trade.action === 'BUY' ? '🔼' : '🔽'} {trade.action}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.tradePnL,
                              { color: trade.pnl >= 0 ? '#2ecc71' : '#e74c3c' },
                            ]}
                          >
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </ViewShot>

            {/* Download / Share Buttons */}
            {monthData.trades.length > 0 && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.downloadBtn} onPress={downloadSlip}>
                  <Text style={styles.buttonText}>💾 Download Slip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={shareSlip}>
                  <Text style={styles.buttonText}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e3a5f',
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    borderWidth: 0,
  },
  navText: {
    color: '#1e3a5f',
    fontWeight: '700',
    fontSize: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00d4ff',
  },
  loading: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  slipContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e8eef7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  slipTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1e3a5f',
    marginBottom: 5,
    letterSpacing: 1,
  },
  slipMonth: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 18,
    fontWeight: '600',
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyState: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  netPnlBox: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  netProfitBox: {
    backgroundColor: '#f0ffe6',
    borderColor: '#2ecc71',
  },
  netLossBox: {
    backgroundColor: '#ffe6e6',
    borderColor: '#e74c3c',
  },
  netPnlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  netPnlValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  summaryBox: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profitItem: {
    flex: 1,
    backgroundColor: '#f0ffe6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  lossItem: {
    flex: 1,
    backgroundColor: '#ffe6e6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#1e3a5f',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#00d4ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#1e3a5f',
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a5f',
  },
  tradeListBox: {
    marginTop: 16,
  },
  tradeListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef7',
    backgroundColor: '#f8f9fa',
    marginBottom: 6,
    borderRadius: 8,
  },
  tradeLeft: {
    flex: 1,
  },
  tradePair: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a5f',
  },
  tradeAction: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  tradePnL: {
    fontSize: 13,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8eef7',
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#2ecc71',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#00d4ff',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  profit: {
    color: '#2ecc71',
  },
  loss: {
    color: '#e74c3c',
  },
});
