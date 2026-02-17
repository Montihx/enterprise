
import pytest
from unittest.mock import AsyncMock, patch
from app.services.parsers.shikimori import ShikimoriParserService
from app.models.parser import ParserJob
from app.crud.crud_parser import parser_job as crud_job
from uuid import uuid4

@pytest.fixture
def mock_job():
    job = ParserJob(
        id=uuid4(),
        parser_name="shikimori",
        job_type="full_sync",
        status="pending",
        progress=0
    )
    return job

@pytest.mark.asyncio
async def test_run_full_sync_basic(db_session, mock_job):
    # Mock CRUD to return our job
    with patch('app.services.parsers.shikimori.crud_job.get', new_callable=AsyncMock) as mock_get, \
         patch('app.services.parsers.shikimori.crud_job.update', new_callable=AsyncMock) as mock_update, \
         patch('app.services.parsers.shikimori.crud_anime.create', new_callable=AsyncMock) as mock_create, \
         patch('app.services.parsers.shikimori.crud_anime.get_by_shikimori_id', new_callable=AsyncMock) as mock_get_anime:
        
        mock_get.return_value = mock_job
        mock_get_anime.return_value = None # No existing anime, so create new

        service = ShikimoriParserService()
        
        # Mock Client Responses
        mock_list_response = AsyncMock()
        mock_list_response.json.return_value = [
            {'id': 1, 'name': 'Anime 1', 'kind': 'tv', 'score': '8.0'}
        ]
        mock_list_response.raise_for_status = lambda: None

        mock_detail_response = AsyncMock()
        mock_detail_response.json.return_value = {
            'id': 1, 'name': 'Anime 1', 'kind': 'tv', 'score': '8.0', 
            'genres': [{'russian': 'Action'}]
        }
        mock_detail_response.raise_for_status = lambda: None

        # We need to mock the client.get to return list first, then detail, then empty list to break loop
        service.client.get = AsyncMock(side_effect=[
            mock_list_response, # Page 1 list
            mock_detail_response, # Item detail
            AsyncMock(json=lambda: [], raise_for_status=lambda: None) # Page 2 empty
        ])

        # Run
        config = {'min_score': 5.0}
        await service.run_full_sync(db_session, str(mock_job.id), config)

        # Assertions
        assert mock_update.call_count >= 2 # Start, Progress, Finish
        assert mock_create.call_count == 1 # One anime created
        
        # Verify status update calls
        call_args = mock_update.call_args_list
        assert call_args[0][1]['obj_in']['status'] == 'running'
        assert call_args[-1][1]['obj_in']['status'] == 'completed'
