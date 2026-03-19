# Neuro-Scan: Mobile Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Neuro-Scan** is a deep learning-powered medical imaging system designed to analyze MRI scans. This repository contains the source code for the **Mobile Application**, built using React Native and Expo, which allows physicians and researchers to analyze neurological data on iOS and Android devices dynamically.

---

## 🌐 About & Live Demo
You can try out the live web version of our companion application here:
👉 **[Neuro-Scan Web - Live Demo](https://neuroscan-web.netlify.app/)**

📱 **For Android Users:** You can download the compiled `.apk` file for testing this application directly from the **[Releases](https://github.com/Samarth-Sharma21/Neuroscan_Mobile/releases)** section of this repository.

> **Web Application Repository:** Please note that the companion web application interface for Neuro-Scan can be found here: [Neuroscan_website](https://github.com/Samarth-Sharma21/Neuroscan_website). 

---

## 🎯 Purpose and Software Impact
This repository accompanies our submission to the *Software Impacts* journal. The Neuro-Scan mobile app brings advanced neurological MRI analysis directly to clinical researchers and practitioners at the point of care. It illustrates how complex deep learning inferences can be packaged into highly accessible, platform-agnostic tooling.

## ✨ Features
- **Mobile Point-of-Care:** Take/upload MRI scans directly from the mobile device to the backend.
- **AI-Powered Analysis:** Fast and efficient communication with PyTorch-based inference endpoints.
- **Cross-Platform:** Built on React Native via Expo, providing a unified, high-performance UI across both iOS and Android platforms.
- **Unified Ecosystem:** Fully connected with our unified database and models mirroring our [Website App (Next.js)](https://github.com/Samarth-Sharma21/Neuroscan_website).

---

## 🛠️ Required Dependencies
Compilation and reproducible use natively require:
- **Node.js** (v18.x or above)
- **React Native Framework**: Expo Framework & SDK
- **Device Emulator / Testing**: Expo Go, Android Studio, or Xcode (for iOS)
- **Machine Learning Backend** (If configuring custom server): Python, PyTorch, NumPy, Pandas

---

## 🚀 Getting Started (How-to Guide)

### 1. Clone the repository
```bash
git clone https://github.com/Samarth-Sharma21/Neuroscan_Mobile.git
cd Neuroscan_Mobile
```

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize the development environment
Start the Expo Metro bundler:
```bash
npx expo start
```
You can scan the generated QR code using the **Expo Go** app on your physical iOS or Android device to test the application instantly. Press `a` to open in an Android Emulator, or `i` to open in an iOS Simulator.

---

## 📂 Repository Structure
- `app/` (or central navigation files) - Handled through Expo Router screens.
- `assets/` - Static images, fonts, and icons.
- `components/` - Reusable application UI elements (buttons, image visualizers, layout).
- `app.json` - Expo workspace and build configurations.

---

## 📄 License & Legal
This project is licensed under the **MIT License**. See the `LICENSE` file for full details.

## 📚 Citation
If you use this software in your research, please cite our corresponding paper in *Software Impacts*:
```bibtex
@article{neuroscan202X,
  title={Neuro-Scan: ...},
  author={Sharma, Samarth and ...},
  journal={Software Impacts},
  year={202X}
}
```

## ✉️ Support
For questions, support, or reproducible capsule setups, please contact: **Samarthsharma7621@gmail.com**
