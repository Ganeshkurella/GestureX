import os
import joblib
import pandas as pd
import numpy as np
import matplotlib
# Use Agg backend for Matplotlib to avoid GUI threading issues on non-interactive runs
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay

# Import synthetic seeder to ensure dataset exists
from app.cv.synthetic_generator import seed_dataset, CSV_PATH, DATA_DIR

MODEL_PATH = os.path.join(DATA_DIR, 'model.joblib')
ENCODER_PATH = os.path.join(DATA_DIR, 'label_encoder.joblib')

def main():
    # 1. Dataset Self-Bootstrapping Check
    if not os.path.exists(CSV_PATH) or os.path.getsize(CSV_PATH) < 100:
        print("Dataset CSV not found or empty. Seeding synthetic gesture coordinates...")
        seed_dataset()
        
    print("\nLoading dataset from CSV...")
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {df.shape[0]} samples with {df.shape[1] - 1} features.")

    # 2. Separate Features (X) and Labels (y)
    # Feature columns: x0, y0, z0, ..., z20
    X = df.drop(columns=['gesture_name']).values
    y = df['gesture_name'].values

    # 3. Label Encoding
    print("Encoding target gesture labels...")
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Save the encoder for backend API reference mapping
    joblib.dump(label_encoder, ENCODER_PATH)
    print(f"Saved LabelEncoder maps: {list(enumerate(label_encoder.classes_))}")

    # 4. Stratified Train/Test Split (80/20)
    print("Splitting dataset into train/test sets (80/20 stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # 5. RandomForest Model Setup & Training
    print("Initializing RandomForestClassifier (100 estimators)...")
    # max_depth=12 prevents deep overfitting while maintaining landmark separation
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    
    print("Fitting model...")
    clf.fit(X_train, y_train)
    print("Model training complete.")

    # 6. Evaluation metrics
    print("\n" + "="*50)
    print("                 EVALUATION REPORT")
    print("="*50)
    
    # Validation accuracy
    train_acc = clf.score(X_train, y_train)
    test_acc = clf.score(X_test, y_test)
    print(f"Train Accuracy: {train_acc * 100:.2f}%")
    print(f"Test Accuracy:  {test_acc * 100:.2f}%")
    
    # Detailed classification metrics
    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
    print("\nClassification Metrics:")
    print(report)

    # 7. Generate Visualizations
    print("Generating training diagnostic plots...")
    
    # A. Confusion Matrix Plot
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=label_encoder.classes_)
    disp.plot(cmap=plt.cm.Blues, ax=ax, values_format='d')
    plt.title("GestureX Confusion Matrix (Phase 3 Validation)")
    plt.tight_layout()
    cm_plot_path = os.path.join(DATA_DIR, 'confusion_matrix.png')
    plt.savefig(cm_plot_path, dpi=150)
    plt.close()
    print(f"Saved Confusion Matrix: {cm_plot_path}")

    # B. Feature Importance Plot (Landmarks)
    # Map the flat 63 coordinates back to joint names for readable analysis
    coordinate_names = []
    landmark_names = [
        "Wrist", "Thumb CMC", "Thumb MCP", "Thumb IP", "Thumb Tip",
        "Index MCP", "Index PIP", "Index DIP", "Index Tip",
        "Middle MCP", "Middle PIP", "Middle DIP", "Middle Tip",
        "Ring MCP", "Ring PIP", "Ring DIP", "Ring Tip",
        "Pinky MCP", "Pinky PIP", "Pinky DIP", "Pinky Tip"
    ]
    for i in range(21):
        for j in range(i + 1, 21):
            coordinate_names.append(f"{landmark_names[i]} to {landmark_names[j]}")
        
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1][:15] # Top 15 features
    
    fig, ax = plt.subplots(figsize=(10, 6))
    plt.title("Top 15 Most Important Joint Features")
    plt.bar(range(15), importances[indices], color='teal', align='center')
    plt.xticks(range(15), [coordinate_names[i] for i in indices], rotation=45, ha='right')
    plt.xlim([-1, 15])
    plt.ylabel("Relative Importance")
    plt.tight_layout()
    fi_plot_path = os.path.join(DATA_DIR, 'feature_importance.png')
    plt.savefig(fi_plot_path, dpi=150)
    plt.close()
    print(f"Saved Feature Importance Chart: {fi_plot_path}")

    # 8. Model Serialization
    joblib.dump(clf, MODEL_PATH)
    print(f"Exported production-ready model: {MODEL_PATH}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
