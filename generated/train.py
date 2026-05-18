import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import os

def load_data(filepath='data/dataset.csv'):
    """Loads data from a CSV file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}. Please place your CSV file there.")
    return pd.read_csv(filepath)

def preprocess_data(df):
    """Preprocesses the data: handles nulls and categoricals."""
    target_col = "No_of_Earning_Members"
    
    if target_col in df.columns:
        y = df[target_col]
        X = df.drop(columns=[target_col])
    else:
        # Fallback to last column as target if target_col not found
        y = df.iloc[:, -1]
        X = df.iloc[:, :-1]
        target_col = df.columns[-1]

    print(f"Target column detected: '{target_col}'")
    print(f"Features: {list(X.columns)}")

    # Identify categorical and numerical features
    categorical_features = X.select_dtypes(include=['object', 'category']).columns
    numerical_features = X.select_dtypes(include=['int64', 'float64']).columns

    # Create preprocessing pipelines for numerical and categorical features
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    return preprocessor, X, y

def train_model(X, y, preprocessor):
    """Trains an SVM (RBF) model with cross-validation."""
    # Create the full pipeline with preprocessing and SVM
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', SVC(kernel='rbf', probability=True, random_state=42))
    ])

    # Convert y to classification labels
    unique_y = y.unique()
    print(f"Unique classes in target: {list(unique_y)}")

    # Cross-validation score (Accuracy because it's multi-class classification)
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"Cross-validation accuracy scores: {cv_scores}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.3f}")

    # Train the model on the entire dataset
    model.fit(X, y)
    return model, cv_scores.mean()

def save_model(model, filepath='model/model.pkl'):
    """Saves the trained model."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(model, filepath)
    print(f"Model saved successfully to {filepath}")

if __name__ == "__main__":
    print("Starting real-world model training pipeline...")
    try:
        data = load_data()
        preprocessor, X, y = preprocess_data(data)
        trained_model, mean_acc = train_model(X, y, preprocessor)
        save_model(trained_model)
        print(f"Training successfully completed! Mean Accuracy: {mean_acc:.3f}")
    except FileNotFoundError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during training: {e}")
