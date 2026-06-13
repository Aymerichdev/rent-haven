from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, rest, storage

app = FastAPI(
    title="BR Internacional API",
    version="1.0.0",
    description="Reemplazo de Supabase Auth + PostgREST. Mantiene Supabase Storage para archivos.",
)

origins = settings.cors_origins_list or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rest.router)
app.include_router(storage.router)


@app.get("/")
def root():
    return {"name": "BR Internacional API", "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
