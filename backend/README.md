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


### 4. Run Redis 

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

```bash
docker start redis
```

### 5. Run the Application

in /backend/

```bash
uvicorn app.main:app --reload
```


docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n