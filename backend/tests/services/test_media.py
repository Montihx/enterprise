
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.media_service import MediaService
from app.core.config import settings

@pytest.mark.asyncio
async def test_process_image_success():
    service = MediaService()
    
    # Mock HTTTPX
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b"fake_image_bytes"
    
    # Mock Aiofiles
    mock_file = AsyncMock()
    
    with patch.object(service.client, 'get', return_value=mock_response) as mock_get, \
         patch('aiofiles.open', return_value=mock_file) as mock_open, \
         patch('PIL.Image.open') as mock_pil_open:
        
        # Mock Pillow
        mock_img = MagicMock()
        mock_img.width = 1200 # Should trigger resize
        mock_img.height = 800
        mock_img.resize.return_value = mock_img
        
        mock_pil_open.return_value.__enter__.return_value = mock_img
        
        url = "http://example.com/image.jpg"
        result = await service.process_image(url, "anime", "test-slug")
        
        assert mock_get.called
        assert mock_pil_open.called
        assert mock_img.resize.called # Checked resize logic
        assert mock_img.save.called
        assert result == f"{settings.STATIC_HOST}/anime/test-slug.webp"

@pytest.mark.asyncio
async def test_process_image_failure():
    service = MediaService()
    
    mock_response = MagicMock()
    mock_response.status_code = 404
    
    with patch.object(service.client, 'get', return_value=mock_response):
        url = "http://example.com/404.jpg"
        result = await service.process_image(url, "anime", "test-slug")
        
        # Should return original URL on failure
        assert result == url
