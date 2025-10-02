# FastAPI entrypoint

#bootstraps ASGI app

from fastapi import FastAPI
from routers import analyze

app = FastAPI(title="Code Analysis API", version="1.0")

# used to keep code modular and testable
app.include_router(analyze.router, prefix="/api/v1")

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",  # Next.js frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)