const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

/**
 * Read data from JSON file
 * @param {string} fileName - Name of the file (without .json extension)
 * @returns {Promise<Array>} - Parsed JSON data
 */
const readData = async (fileName) => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
};

/**
 * Write data to JSON file
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {Array} data - Data to write
 * @returns {Promise<void>}
 */
const writeData = async (fileName, data) => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

/**
 * Add item to data file
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {Object} item - Item to add
 * @returns {Promise<Object>} - Added item with ID
 */
const addItem = async (fileName, item) => {
  const data = await readData(fileName);
  const newItem = {
    ...item,
    id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.push(newItem);
  await writeData(fileName, data);
  return newItem;
};

/**
 * Update item in data file
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {string} id - ID of item to update
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object|null>} - Updated item or null if not found
 */
const updateItem = async (fileName, id, updates) => {
  const data = await readData(fileName);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) {
    return null;
  }
  
  data[index] = {
    ...data[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await writeData(fileName, data);
  return data[index];
};

/**
 * Delete item from data file
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {string} id - ID of item to delete
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
const deleteItem = async (fileName, id) => {
  const data = await readData(fileName);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) {
    return false;
  }
  
  data.splice(index, 1);
  await writeData(fileName, data);
  return true;
};

/**
 * Find item by ID
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {string} id - ID of item to find
 * @returns {Promise<Object|null>} - Found item or null
 */
const findById = async (fileName, id) => {
  const data = await readData(fileName);
  return data.find(item => item.id === id) || null;
};

/**
 * Find items by criteria
 * @param {string} fileName - Name of the file (without .json extension)
 * @param {Function} predicate - Function to test items
 * @returns {Promise<Array>} - Matching items
 */
const findBy = async (fileName, predicate) => {
  const data = await readData(fileName);
  return data.filter(predicate);
};

module.exports = {
  readData,
  writeData,
  addItem,
  updateItem,
  deleteItem,
  findById,
  findBy
};
