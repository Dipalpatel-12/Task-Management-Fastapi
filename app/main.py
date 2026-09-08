from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import task
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.exception_handlers import validation_exception_handler, http_exception_handler

app = FastAPI(title="Task Management API")


app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler) 


app.add_middleware(
    CORSMiddleware,
  allow_origins=[
   "http://localhost:3000",
          "https://taskmanagement-roan-zeta.vercel.app",

  ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task.router)


@app.get("/")
def root():
    return {"message": "Task Management API is running"}