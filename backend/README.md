## Setup Instructions

### 1. Create a Virtual Environment

```bash
python3 -m venv venv
```

### 2. Activate the Virtual Environment

- **On Linux/macOS:**
  ```bash
  source venv/bin/activate
  ```
- **On Windows:**
  ```bash
  venv\Scripts\activate
  ```

### 3. Install Requirements

```bash
pip install -r requirements.txt
```

### 4. Run the Application

in /backend/

```bash
uvicorn app.main:app --reload
```
