from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

import os, logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from core import db, client, hash_password, verify_password
from routers import auth, master, recipes, operations, finance, settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Business Finance & HPP Management System")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"message": "Business Finance & HPP Management System API"}


for r in (auth.router, master.router, recipes.router, operations.router, finance.router, settings_router.router):
    api.include_router(r)
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    for c in ("raw_materials", "products", "recipes", "purchases", "sales", "expenses", "production_orders", "cash_transactions", "inventory_transactions"):
        await db[c].create_index([("business_id", 1), ("date", -1)] if c in ("purchases", "sales", "expenses", "production_orders", "cash_transactions", "inventory_transactions") else [("business_id", 1)])
    await db.recipe_items.create_index("recipe_id")
    email = os.environ.get("ADMIN_EMAIL")
    pw = os.environ.get("ADMIN_PASSWORD")
    if email and pw:
        existing = await db.users.find_one({"email": email})
        if not existing:
            await auth.create_user_with_business("Pemilik Usaha", email, pw, "Usaha Demo UMKM")
            logger.info("Admin user seeded")
        elif not verify_password(pw, existing["password_hash"]):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})
    try:
        settings_router.init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
