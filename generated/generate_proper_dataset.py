import pandas as pd
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)

# Number of samples
n_rows = 500

# Generate synthetic data matching the API schema
data = {}

# Generate features matching the API schema
data['Mthly_HH_Income'] = np.random.uniform(10000, 150000, n_rows)
data['Mthly_HH_Expense'] = np.random.uniform(5000, 80000, n_rows)
data['No_of_Fly_Members'] = np.random.randint(1, 11, n_rows)
data['Emi_or_Rent_Amt'] = np.random.uniform(0, 50000, n_rows)
data['Annual_HH_Income'] = data['Mthly_HH_Income'] * 12  # Keep it consistent
data['Highest_Qualified_Member'] = np.random.choice([
    'Illiterate', 'Under-Graduate', 'Graduate', 'Post-Graduate', 'Professional'
], n_rows)

# Generate target variable (No_of_Earning_Members) based on logical relationships
# Higher income and education should correlate with more earning members
earning_members = []
for i in range(n_rows):
    # Base probability based on family size
    family_size = data['No_of_Fly_Members'][i]
    base_prob = min(family_size / 2, 4)  # Max 4 earning members
    
    # Adjust based on income (higher income = more likely to have earning members)
    income_factor = data['Mthly_HH_Income'][i] / 100000  # Normalize
    
    # Adjust based on education
    education_factor = {
        'Illiterate': 0.5,
        'Under-Graduate': 0.7,
        'Graduate': 1.0,
        'Post-Graduate': 1.2,
        'Professional': 1.4
    }[data['Highest_Qualified_Member'][i]]
    
    # Calculate expected earning members
    expected = base_prob * income_factor * education_factor
    expected = max(0, min(expected, family_size))  # Bound by family size
    
    # Add some randomness
    earning = int(np.random.poisson(expected))
    earning = max(0, min(earning, family_size, 4))  # Ensure realistic bounds
    
    earning_members.append(earning)

data['No_of_Earning_Members'] = earning_members

# Create DataFrame and save
df = pd.DataFrame(data)
print("Dataset shape:", df.shape)
print("\nDataset info:")
print(df.info())
print("\nTarget distribution:")
print(df['No_of_Earning_Members'].value_counts().sort_index())
print("\nFirst few rows:")
print(df.head())

# Save the dataset
df.to_csv('data/dataset.csv', index=False)
print("\nDataset saved to data/dataset.csv")