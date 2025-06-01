# 🎵 Indian Classical Music Explorer
![image](https://github.com/user-attachments/assets/58016a8c-ecd8-405f-ad18-d8bc235851c9)



This project is a full-stack web application designed to help users **analyze**, **generate**, and **explore** the world of **Indian classical music**.

## 🏗️ Project Structure


---

## 🚀 Features Overview

### 🧑‍💼 Authentication & Roles
- Uses [Clerk](https://clerk.com) for user authentication.
- Role-based access (admin, creator, listener) for different levels of interaction.

### 🧠 Music Analysis
- Upload an audio file to analyze its **genre**, **instrument**, and **musical characteristics**.
- Uses **Librosa** to extract features like tempo, pitch, chroma, etc.
- Custom-built **ML models** to detect:
  - 🎼 Genre of the music.
  - 🎻 Instruments used.

### 🎶 Music Generation
- Users can generate new Indian classical music samples.
- Backed by a **custom-trained music generation model** that understands ragas and rhythmic patterns.

### 🔍 Explore
- Dive into curated pieces, artist highlights, and discover ragas, thaats, and instruments with rich metadata.

---

## 🧬 Tech Stack

| Layer     | Tech                                 |
|-----------|--------------------------------------|
| Frontend  | Next.js, Tailwind CSS, Clerk Auth    |
| Backend   | Flask, MongoDB                       |
| ML Models | Custom-trained genre/instrument models, MusicGen |
| Audio     | Librosa for feature extraction       |

---

## 🔄 Workflow

1. **User Sign Up** via Clerk
2. **Role is assigned** (default: listener)
3. User can:
   - Navigate to **Analyze** tab: upload music → get genre + instrument prediction.
   - Use the **Generate** tab: generate music via our model.
   - Go to **Explore**: learn about Indian classical music, artists, and ragas.
4. Admins/creators have access to additional tools to upload training data or retrain models.

---

## 🖼️ Screenshots

### Analyze Page
<!-- Upload Screenshot of Analyze Page -->
![image](https://github.com/user-attachments/assets/fb080ef4-eed0-4f9b-9dff-e90c22e28508)


### Generate Page
<!-- Upload Screenshot of Generate Page -->
![image](https://github.com/user-attachments/assets/734fe622-6d20-4520-9741-324b65b7a40e)


---

## 🛠️ Setup Instructions

### Prerequisites:
- Python 3.10+
- Node.js 18+
- MongoDB running locally or via cloud (e.g., MongoDB Atlas)

### 1. Clone the repository:
```bash
git clone https://github.com/your-username/indian-classical-music-explorer.git
cd indian-classical-music-explorer
to run server file 
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```
cd ../client
npm install
npm run dev
