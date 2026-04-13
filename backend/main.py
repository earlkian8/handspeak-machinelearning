from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, practice, study
from routes import gesture

app = FastAPI(title="HandSpeak API", version="1.0.0")

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(practice.router)
app.include_router(study.router)
app.include_router(gesture.router)


@app.get("/")
def root():
    return {"message": "HandSpeak API is running 🐠"}
