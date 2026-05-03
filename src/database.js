import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('forex_journal.db');

// Creates the table when app opens for the first time
export const initDatabase = () => {
  db.execSync(
    `CREATE TABLE IF NOT EXISTS trades (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      entry_time  TEXT,
      pair        TEXT NOT NULL,
      entry_price REAL NOT NULL,
      target      REAL NOT NULL,
      stop_loss   REAL NOT NULL,
      pnl         REAL NOT NULL,
      action      TEXT NOT NULL,
      notes       TEXT,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );
};

// Save a new trade
export const addTrade = (trade) => {
  const { date, entry_time, pair, entry_price, target, stop_loss, pnl, action, notes } = trade;
  db.runSync(
    `INSERT INTO trades (date, entry_time, pair, entry_price, target, stop_loss, pnl, action, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [date, entry_time || '', pair, entry_price, target, stop_loss, pnl, action, notes || '']
  );
};

// Get all trades — used by Daily View
export const getAllTrades = () => {
  return db.getAllSync('SELECT * FROM trades ORDER BY date DESC, created_at DESC;');
};

// Get trades for one month — used by Monthly View
export const getTradesByMonth = (monthStr) => {
  return db.getAllSync(
    `SELECT * FROM trades WHERE date LIKE ? ORDER BY date DESC;`,
    [`${monthStr}-%`]
  );
};

// Delete a trade
export const deleteTrade = (id) => {
  db.runSync('DELETE FROM trades WHERE id = ?;', [id]);
};

// Update a trade
export const updateTrade = (id, trade) => {
  const { date, entry_time, pair, entry_price, target, stop_loss, pnl, action, notes } = trade;
  db.runSync(
    `UPDATE trades SET date = ?, entry_time = ?, pair = ?, entry_price = ?, target = ?, stop_loss = ?, pnl = ?, action = ?, notes = ? WHERE id = ?;`,
    [date, entry_time || '', pair, entry_price, target, stop_loss, pnl, action, notes || '', id]
  );
};