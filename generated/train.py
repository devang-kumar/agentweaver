import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, accuracy_score
from sklearn.svm import SVC
import joblib
import os

# Define features and target based on the API schema
FEATURES = ['Mthly_HH_Income', 'Mthly_HH_Expense', 'No_of_Fly_Members', 'Emi_or_Rent_Amt', 'Annual_HH_Income', 'Highest_Qualified_Member']
TARGET = 'No_of_Earning_Members'

def load_data(filepath='data/dataset.csv'):
    """Loads the dataset from a CSV file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    df = pd.read_csv(filepath)
    return df

def preprocess_data(df):
    """Preprocesses the data: handles missing values and categoricals."""
    # Separate features and target
    X = df[FEATURES]
    y = df[TARGET]

    # Identify categorical and numerical features
    categorical_features = ['Highest_Qualified_Member']
    numerical_features = ['Mthly_HH_Income', 'Mthly_HH_Expense', 'No_of_Fly_Members', 'Emi_or_Rent_Amt', 'Annual_HH_Income']

    # Create preprocessing pipelines for numerical and categorical features
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # For categorical features, we'll use label encoding since we have ordinal education levels
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
    ])

    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    return preprocessor, X, y

def encode_categorical_features(X):
    """Manually encode categorical features for better control."""
    X_encoded = X.copy()
    
    # Encode education levels with meaningful order
    education_mapping = {
        'Illiterate': 0,
        'Under-Graduate': 1, 
        'Graduate': 2,
        'Post-Graduate': 3,
        'Professional': 4
    }
    X_encoded['Highest_Qualified_Member'] = X_encoded['Highest_Qualified_Member'].map(education_mapping)
    
    return X_encoded

if __name__ == "__main__":
    # Load data
    try:
        data = load_data()
        print(f"Loaded dataset with shape: {data.shape}")
        print(f"Target distribution:\n{data[TARGET].value_counts().sort_index()}")
    except FileNotFoundError as e:
        print(e)
        exit()

    # Separate features and target
    X = data[FEATURES]
    y = data[TARGET]
    
    # Encode categorical features
    X_encoded = encode_categorical_features(X)
    
    print(f"Features: {FEATURES}")
    print(f"Target: {TARGET}")
    print(f"Feature dtypes:\n{X_encoded.dtypes}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42, stratify=y)

    # Create preprocessing pipeline for numerical features only (categorical already encoded)
    numerical_features = ['Mthly_HH_Income', 'Mthly_HH_Expense', 'No_of_Fly_Members', 'Emi_or_Rent_Amt', 'Annual_HH_Income', 'Highest_Qualified_Member']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features)
        ])

    # Create model pipeline with SVM (as mentioned in the API)
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', SVC(kernel='rbf', probability=True, random_state=42))
    ])

    # Train the model
    print("Training model...")
    model_pipeline.fit(X_train, y_train)

    # Evaluate the model
    print("Evaluating model...")
    y_pred = model_pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Test with some sample predictions to ensure variety
    print("\nTesting sample predictions:")
    test_samples = [
        {'Mthly_HH_Income': 30000, 'Mthly_HH_Expense': 15000, 'No_of_Fly_Members': 3, 'Emi_or_Rent_Amt': 5000, 'Annual_HH_Income': 360000, 'Highest_Qualified_Member': 0},  # Low income, Illiterate
        {'Mthly_HH_Income': 80000, 'Mthly_HH_Expense': 40000, 'No_of_Fly_Members': 4, 'Emi_or_Rent_Amt': 10000, 'Annual_HH_Income': 960000, 'Highest_Qualified_Member': 2},  # Medium income, Graduate
        {'Mthly_HH_Income': 120000, 'Mthly_HH_Expense': 50000, 'No_of_Fly_Members': 5, 'Emi_or_Rent_Amt': 15000, 'Annual_HH_Income': 1440000, 'Highest_Qualified_Member': 4}  # High income, Professional
    ]
    
    for i, sample in enumerate(test_samples):
        sample_df = pd.DataFrame([sample])
        pred = model_pipeline.predict(sample_df)[0]
        proba = model_pipeline.predict_proba(sample_df)[0]
        print(f"Sample {i+1}: Income={sample['Mthly_HH_Income']}, Education={sample['Highest_Qualified_Member']} -> Prediction: {pred}, Probabilities: {proba}")

    # Save the trained model
    model_filename = 'model/model.pkl'
    os.makedirs('model', exist_ok=True)
    joblib.dump(model_pipeline, model_filename)
    print(f"\nModel saved to {model_filename}")
    
    # Verify model can be loaded
    loaded_model = joblib.load(model_filename)
    print("Model successfully loaded and verified!")
