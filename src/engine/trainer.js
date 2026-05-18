import * as tf from '@tensorflow/tfjs';

/**
 * Parses raw CSV text into a structured dataset.
 * Handles headers, typed values, and basic cleaning.
 */
export function parseCSV(csvText) {
  if (!csvText || !csvText.trim()) return null;

  const lines = csvText.trim().split('\n').map(l => l.split(',').map(v => v.trim()));
  if (lines.length < 2) return null;

  const headers = lines[0];
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    if (values.length !== headers.length) continue; // skip malformed

    const obj = {};
    headers.forEach((h, idx) => {
      const val = values[idx];
      // Convert to number if possible, else keep string
      const num = Number(val);
      obj[h] = isNaN(num) || val === '' ? val : num;
    });
    rows.push(obj);
  }

  return { headers, rows };
}

/**
 * Trains a real machine learning model in the browser using TensorFlow.js.
 * @param {object} params
 * @param {Array} params.rows - the parsed rows
 * @param {string} params.target - the label column
 * @param {string[]} params.features - the feature columns
 * @param {number} [params.epochs=20]
 * @param {Function} [params.onEpoch] - progress callback (epoch, loss, accuracy)
 */
export async function trainModel({ rows, target, features, epochs = 20, onEpoch }) {
  // ── Prepare Raw Data & Encode Categoricals ────────────────────────────────
  const X_data = [];
  const y_data = [];
  const catMaps = {};

  rows.forEach(r => {
    const x_row = [];
    features.forEach(f => {
      const val = r[f];
      if (typeof val === 'string') {
        if (!catMaps[f]) catMaps[f] = [];
        let idx = catMaps[f].indexOf(val);
        if (idx === -1) {
          idx = catMaps[f].length;
          catMaps[f].push(val);
        }
        x_row.push(idx);
      } else {
        x_row.push(val ?? 0);
      }
    });
    X_data.push(x_row);

    const targetVal = r[target];
    if (typeof targetVal === 'string') {
      if (!catMaps[target]) catMaps[target] = [];
      let idx = catMaps[target].indexOf(targetVal);
      if (idx === -1) {
        idx = catMaps[target].length;
        catMaps[target].push(targetVal);
      }
      y_data.push(idx);
    } else {
      y_data.push(targetVal ?? 0);
    }
  });

  const uniqueY = [...new Set(y_data)];
  const isClassifier = uniqueY.length <= 10;
  const numClasses = uniqueY.length;

  // ── Feature Standardization (Mean = 0, Std = 1) ───────────────────────────
  const featStats = features.map((_, featIdx) => {
    const vals = X_data.map(row => row[featIdx]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance) || 1;
    return { mean, std };
  });

  const X_scaled = X_data.map(row => {
    return row.map((val, featIdx) => {
      const { mean, std } = featStats[featIdx];
      return (val - mean) / std;
    });
  });

  // ── Target Normalization (Min-Max Scaling to [0, 1] for Regression) ───────
  let y_scaled = [...y_data];
  let targetMin = 0;
  let targetMax = 1;
  let targetRange = 1;

  if (!isClassifier) {
    targetMin = Math.min(...y_data);
    targetMax = Math.max(...y_data);
    targetRange = (targetMax - targetMin) || 1;
    y_scaled = y_data.map(val => (val - targetMin) / targetRange);
  }

  // ── Convert Data to Tensors ───────────────────────────────────────────────
  const X_tensor = tf.tensor2d(X_scaled);
  let y_tensor;
  if (isClassifier) {
    y_tensor = tf.oneHot(tf.tensor1d(y_data).toInt(), numClasses);
  } else {
    y_tensor = tf.tensor1d(y_scaled);
  }

  let model;

  if (isClassifier) {
    // Classification Neural Network
    model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [features.length] }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: numClasses, activation: 'softmax' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  } else {
    // Regression Neural Network
    model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [features.length] }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1 }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.02),
      loss: 'meanSquaredError',
    });
  }

  // ── Train Model ───────────────────────────────────────────────────────────
  await model.fit(X_tensor, y_tensor, {
    epochs,
    batchSize: 16, // smaller batch size for stable training
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onEpoch?.({
          epoch: epoch + 1,
          loss: logs.loss,
          accuracy: isClassifier ? logs.acc : null,
          rmse: isClassifier ? null : Math.sqrt(logs.loss) * targetRange, // Real physical RMSE
        });
      },
    },
  });

  // ── Evaluate & Inverse Scale Metrics ──────────────────────────────────────
  const evaluation = model.evaluate(X_tensor, y_tensor);
  let finalAccuracy = 1.0;
  let finalLoss = 0.0;

  if (Array.isArray(evaluation)) {
    finalLoss = await evaluation[0].data();
    finalAccuracy = await evaluation[1].data();
  } else {
    finalLoss = await evaluation.data();
  }

  // Get real predictions to calculate true physical RMSE
  const predsTensor = model.predict(X_tensor);
  const predData = await predsTensor.data();
  predsTensor.dispose();

  let finalRMSE = null;
  if (!isClassifier) {
    const predsOriginal = Array.from(predData).map(p => p * targetRange + targetMin);
    const squaredErrors = y_data.map((actual, idx) => Math.pow(actual - predsOriginal[idx], 2));
    const meanSquaredError = squaredErrors.reduce((a, b) => a + b, 0) / y_data.length;
    finalRMSE = parseFloat(Math.sqrt(meanSquaredError).toFixed(4));
  }

  // Clean tensors
  X_tensor.dispose();
  y_tensor.dispose();

  return {
    accuracy: isClassifier ? parseFloat(finalAccuracy[0].toFixed(4)) : null,
    rmse: finalRMSE,
    loss: parseFloat(finalLoss[0].toFixed(4)),
    problemType: isClassifier ? 'classification' : 'regression',
    catMaps,
  };
}

/**
 * Dynamically synthesizes a high-fidelity, mathematically consistent dataset (CSV format)
 * tailored to a specific user problem statement. This bypasses simulated dry-run modes completely.
 * @param {string} problemStatement - the user's problem statement
 */
export function generateSyntheticCSV(problemStatement) {
  const prompt = (problemStatement || '').toLowerCase();
  let domain = 'general';

  if (prompt.includes('hous') || prompt.includes('real estate') || prompt.includes('property') || prompt.includes('rent') || prompt.includes('price')) {
    domain = 'real_estate';
  } else if (prompt.includes('loan') || prompt.includes('credit') || prompt.includes('bank') || prompt.includes('income') || prompt.includes('finance') || prompt.includes('money') || prompt.includes('earning')) {
    domain = 'finance';
  } else if (prompt.includes('heart') || prompt.includes('cancer') || prompt.includes('health') || prompt.includes('patient') || prompt.includes('medical') || prompt.includes('disease')) {
    domain = 'health';
  } else if (prompt.includes('device') || prompt.includes('sensor') || prompt.includes('iot') || prompt.includes('cpu') || prompt.includes('tech') || prompt.includes('network') || prompt.includes('latency')) {
    domain = 'tech';
  }

  const rows = [];
  let headers = [];

  if (domain === 'real_estate') {
    headers = ['SquareFeet', 'Bedrooms', 'Bathrooms', 'YearBuilt', 'HasGarage', 'Price'];
    for (let i = 0; i < 65; i++) {
      const sqft = Math.round(900 + Math.random() * 3100);
      const beds = Math.round(1 + Math.random() * 4);
      const baths = Math.round(1 + Math.random() * 2);
      const year = Math.round(1975 + Math.random() * 50);
      const garage = Math.random() > 0.45 ? 1 : 0;
      // House Price formula: base + sqft + beds + baths + garage
      const price = Math.round(60000 + sqft * 145 + beds * 30000 + baths * 20000 + garage * 15000 + (Math.random() - 0.5) * 12000);
      rows.push({ SquareFeet: sqft, Bedrooms: beds, Bathrooms: baths, YearBuilt: year, HasGarage: garage, Price: price });
    }
  } else if (domain === 'finance') {
    headers = ['MonthlyIncome', 'CreditScore', 'DebtToIncome', 'Age', 'LoanAmount', 'Approved'];
    for (let i = 0; i < 65; i++) {
      const income = Math.round(2500 + Math.random() * 15500);
      const score = Math.round(520 + Math.random() * 330);
      const dti = parseFloat((0.15 + Math.random() * 0.65).toFixed(2));
      const age = Math.round(22 + Math.random() * 48);
      const loan = Math.round(15000 + Math.random() * 135000);
      const risk = (income / 10000) + (score - 600) / 100 - dti * 1.8 - (loan / income) * 0.4;
      const approved = risk > 0.4 ? 1 : 0;
      rows.push({ MonthlyIncome: income, CreditScore: score, DebtToIncome: dti, Age: age, LoanAmount: loan, Approved: approved });
    }
  } else if (domain === 'health') {
    headers = ['Age', 'BloodPressure', 'Cholesterol', 'BMI', 'Smoker', 'HeartDisease'];
    for (let i = 0; i < 65; i++) {
      const age = Math.round(26 + Math.random() * 49);
      const bp = Math.round(95 + Math.random() * 55);
      const chol = Math.round(160 + Math.random() * 140);
      const bmi = parseFloat((19.0 + Math.random() * 17.5).toFixed(1));
      const smoker = Math.random() > 0.78 ? 1 : 0;
      const risk = (age - 38) / 32 + (bp - 118) / 38 + (chol - 195) / 95 + (bmi - 24) / 9 + smoker * 1.4;
      const heart = risk > 1.15 ? 1 : 0;
      rows.push({ Age: age, BloodPressure: bp, Cholesterol: chol, BMI: bmi, Smoker: smoker, HeartDisease: heart });
    }
  } else if (domain === 'tech') {
    headers = ['CpuCores', 'RamGb', 'StorageGb', 'GpuPower', 'PowerWatts', 'Price'];
    for (let i = 0; i < 65; i++) {
      const cores = Math.random() > 0.55 ? 8 : (Math.random() > 0.5 ? 16 : 4);
      const ram = Math.random() > 0.55 ? 16 : (Math.random() > 0.5 ? 32 : 8);
      const storage = Math.random() > 0.35 ? 512 : (Math.random() > 0.55 ? 1024 : 256);
      const gpu = Math.round(80 + Math.random() * 240);
      const price = cores * 42 + ram * 14 + storage * 0.16 + gpu * 2.4 + Math.round(110 + Math.random() * 190);
      const watts = Math.round(cores * 7.5 + ram * 0.48 + gpu * 1.15 + 45);
      rows.push({ CpuCores: cores, RamGb: ram, StorageGb: storage, GpuPower: gpu, PowerWatts: watts, Price: price });
    }
  } else {
    // Default household earnings dataset
    headers = ['Mthly_HH_Income', 'Mthly_HH_Expense', 'No_of_Fly_Members', 'Emi_or_Rent_Amt', 'Annual_HH_Income', 'No_of_Earning_Members'];
    for (let i = 0; i < 65; i++) {
      const income = Math.round(25000 + Math.random() * 105000);
      const expense = Math.round(9000 + Math.random() * 36000);
      const members = Math.round(2 + Math.random() * 5);
      const emi = Math.random() > 0.65 ? Math.round(3000 + Math.random() * 13000) : 0;
      const annual = income * 12;
      const earnings = Math.max(1, Math.min(members - 1, Math.round(1 + (income / 42000) + (Math.random() * 1.15))));
      rows.push({ Mthly_HH_Income: income, Mthly_HH_Expense: expense, No_of_Fly_Members: members, Emi_or_Rent_Amt: emi, Annual_HH_Income: annual, No_of_Earning_Members: earnings });
    }
  }

  return { headers, rows };
}
