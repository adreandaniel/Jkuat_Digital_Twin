from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import routes_weather, routes_terrain, routes_flood, routes_simulation, routes_layers

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Backend for the Juja Flood & Environmental Digital Twin.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_weather.router, prefix=settings.API_V1_STR)
app.include_router(routes_terrain.router, prefix=settings.API_V1_STR)
app.include_router(routes_flood.router, prefix=settings.API_V1_STR)
app.include_router(routes_simulation.router, prefix=settings.API_V1_STR)
app.include_router(routes_layers.router, prefix=settings.API_V1_STR)


@app.get("/")
def health():
    return {"status": "online", "service": settings.PROJECT_NAME, "version": "2.0.0"}


@app.get(f"{settings.API_V1_STR}/")
def api_health():
    return health()
