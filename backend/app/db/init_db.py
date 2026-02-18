import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.crud.crud_user import user as crud_user
from app.crud.crud_role import role as crud_role
from app.schemas.user import UserCreate
from app.schemas.role import RoleCreate
from app.models.system import SiteSetting
from app.models.parser import ParserSettings

logger = logging.getLogger(__name__)

ROLES = [
    {
        "name": "super_admin",
        "description": "Full access to the system",
        "permissions": ["*"]
    },
    {
        "name": "admin",
        "description": "Administrative access",
        "permissions": ["content.*", "users.view", "users.edit", "parsers.*", "analytics.view"]
    },
    {
        "name": "moderator", 
        "description": "Moderation access",
        "permissions": ["content.view", "content.edit", "comments.moderate"]
    },
    {
        "name": "user",
        "description": "Standard user access",
        "permissions": ["content.view", "comments.write"]
    }
]

DEFAULT_SETTINGS = [
    {"key": "site_name", "value": "Kitsu Enterprise", "type": "string", "is_public": True},
    {"key": "maintenance_mode", "value": False, "type": "boolean", "is_public": True},
    {"key": "allow_registration", "value": True, "type": "boolean", "is_public": True},
    {"key": "accent_primary", "value": "#8b5cf6", "type": "color", "is_public": True},
    {"key": "accent_danger", "value": "#ef4444", "type": "color", "is_public": True},
]

PARSER_CATEGORIES = [
    {"category": "general", "description": "Global network and provider settings", "config": {}},
    {"category": "notifications", "description": "Alerting and pulse relay protocols", "config": {}},
    {"category": "advanced", "description": "High-concurrency tuning and engine logic", "config": {}},
    {"category": "blacklist", "description": "Content exclusion and metadata interceptors", "config": {}},
    {"category": "grabbing", "description": "Metadata filters and quality thresholds", "config": {}},
    {"category": "fields", "description": "Schema mapping and template engine", "config": {}},
    {"category": "images", "description": "Visual asset localization and optimization", "config": {}},
    {"category": "player", "description": "CDN hierarchy and streaming logic", "config": {}},
]

async def init_db(db: AsyncSession) -> None:
    # 1. Create Roles
    for role_data in ROLES:
        role = await crud_role.get_by_name(db, name=role_data["name"])
        if not role:
            role_in = RoleCreate(**role_data)
            await crud_role.create(db, obj_in=role_in)
            logger.info(f"Role created: {role_data['name']}")
    
    # 2. Create Superuser
    FIRST_SUPERUSER = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@kitsu.io")
    FIRST_SUPERUSER_PASSWORD = os.getenv("FIRST_SUPERUSER_PASSWORD", "changeme")
    
    user = await crud_user.get_by_email(db, email=FIRST_SUPERUSER)
    if not user:
        super_role = await crud_role.get_by_name(db, name="super_admin")
        
        user_in = UserCreate(
            email=FIRST_SUPERUSER,
            username="admin",
            password=FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            full_name="Initial Admin",
        )
        user = await crud_user.create(db, obj_in=user_in)
        user.role_id = super_role.id
        db.add(user)
        await db.commit()
        logger.info(f"Superuser created: {FIRST_SUPERUSER}")

    # 3. Create Default Site Settings
    for s_data in DEFAULT_SETTINGS:
        result = await db.execute(select(SiteSetting).filter(SiteSetting.key == s_data["key"]))
        if not result.scalars().first():
            setting = SiteSetting(**s_data)
            db.add(setting)
            logger.info(f"Setting provisioned: {s_data['key']}")

    # 4. Create Parser Nodes
    for p_data in PARSER_CATEGORIES:
        result = await db.execute(select(ParserSettings).filter(ParserSettings.category == p_data["category"]))
        if not result.scalars().first():
            node = ParserSettings(**p_data)
            db.add(node)
            logger.info(f"Parser Node provisioned: {p_data['category']}")
    
    await db.commit()
