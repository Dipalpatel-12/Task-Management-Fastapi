from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import task

app = FastAPI(title="Task Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task.router)


@app.get("/")
def root():
    return {"message": "Task Management API is running"}