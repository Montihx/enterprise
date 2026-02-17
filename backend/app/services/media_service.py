import os
import aiofiles
from pathlib import Path
from typing import Optional, Dict
from io import BytesIO
from PIL import Image, ImageDraw
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.logging import logger

class MediaService:
    def __init__(self):
        self.media_root = Path(settings.MEDIA_ROOT)
        self.media_root.mkdir(parents=True, exist_ok=True)
        self.client = httpx.AsyncClient(timeout=15.0)

    async def close(self):
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
        reraise=True
    )
    async def _download_asset(self, url: str) -> bytes:
        """Downloads remote asset with retry logic for transient failures."""
        response = await self.client.get(url)
        response.raise_for_status()
        return response.content

    async def process_image(
        self, 
        url: str, 
        folder: str, 
        filename_base: str, 
        config: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Ingests, optimizes, and localizes assets.
        Checks for existing local nodes to avoid redundant CPU usage.
        """
        if not url: return None
        cfg = config or {}
        
        filename = f"{filename_base}.webp"
        save_dir = self.media_root / folder
        file_path = save_dir / filename
        
        # Audit Fix: Skip if node already exists and localization is forced
        if file_path.exists() and not cfg.get('force_reprocess_media', False):
            return f"{settings.STATIC_HOST}/{folder}/{filename}"

        try:
            image_data = await self._download_asset(url)
            
            import asyncio
            optimized_data = await asyncio.to_thread(
                self._apply_transformations, 
                image_data, 
                cfg
            )

            save_dir.mkdir(parents=True, exist_ok=True)

            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(optimized_data)

            return f"{settings.STATIC_HOST}/{folder}/{filename}"

        except Exception as e:
            logger.error(f"MediaPipeline: Fault at {url} after retries", error=str(e))
            return url 

    def _apply_transformations(self, data: bytes, cfg: Dict) -> bytes:
        with Image.open(BytesIO(data)) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            max_w = cfg.get("max_width", 1200)
            if img.width > max_w:
                ratio = max_w / img.width
                img = img.resize((max_w, int(img.height * ratio)), Image.Resampling.LANCZOS)
            
            if cfg.get("enable_watermark", False):
                draw = ImageDraw.Draw(img)
                text = cfg.get("watermark_text", "KITSU.IO")
                # Handle simple fallback text if font is not loaded
                draw.text((10, 10), text, fill=(255, 255, 255, 128))
            
            output = BytesIO()
            img.save(
                output, 
                format="WEBP", 
                quality=cfg.get("quality_percent", 85), 
                optimize=True
            )
            return output.getvalue()

media_service = MediaService()
