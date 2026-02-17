from app.models.base import Base

# Import all models here for Alembic
from app.models.user import User
from app.models.role import Role
from app.models.anime import Anime
from app.models.episode import Episode
from app.models.release import Release
from app.models.parser import ParserSettings, ParserJob, ParserJobLog, ParserConflict, ScheduledParserJob
from app.models.interaction import Collection, CollectionItem, Comment, WatchProgress, Favorite, Notification
from app.models.system import AuditLog, SiteSetting, Backup