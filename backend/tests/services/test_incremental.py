import pytest
from unittest.mock import AsyncMock, patch
from app.services.parsers.shikimori import ShikimoriParserService
from app.models.parser import ParserJob
from uuid import uuid4

@pytest.mark.asyncio
async def test_incremental_sync_page_limit(db_session):
    # Mock job
    job = ParserJob(id=uuid4(), parser_name="shikimori", job_type="incremental", status="pending")
    
    with patch('app.services.parsers.shikimori.crud_job.get', new_callable=AsyncMock) as mock_get, \
         patch('app.services.parsers.shikimori.crud_job.update', new_callable=AsyncMock) as mock_update, \
         patch('app.services.parsers.shikimori.crud_job_log.create', new_callable=AsyncMock) as mock_log:
        
        mock_get.return_value = job
        service = ShikimoriParserService()
        
        # Mock API to return empty on first page to check if it stops
        mock_res = AsyncMock()
        mock_res.json.return_value = []
        mock_res.raise_for_status = lambda: None
        service.client.get = AsyncMock(return_value=mock_res)
        
        await service.run_incremental_sync(db_session, str(job.id), {})
        
        # Verify sync logic was called with page limit
        assert service.client.get.called
        # Check if first page was requested
        assert service.client.get.call_args[1]['params']['page'] == 1