
from app.core.celery_app import celery_app
from app.core.logging import setup_logging, logger

# Initialize logging for the worker process
setup_logging()

if __name__ == "__main__":
    logger.info("Celery worker starting...")
    # This file is imported by the celery command, 
    # so side-effects here run when the worker starts.
