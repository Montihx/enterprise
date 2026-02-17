
import pytest
from unittest.mock import AsyncMock, patch
from app.services.parsers.kodik import KodikParserService
from app.schemas.anime import AnimeCreate
from app.crud.crud_anime import anime as crud_anime
from uuid import uuid4

@pytest.fixture
async def ongoing_anime(db_session):
    anime = await crud_anime.create(db_session, obj_in=AnimeCreate(
        title="Ongoing Test",
        slug="ongoing-test",
        kodik_id="123",
        status="ongoing",
        episodes_total=12
    ))
    return anime

@pytest.mark.asyncio
async def test_sync_ongoing_releases(db_session, ongoing_anime):
    service = KodikParserService()
    
    # Mock API Response
    mock_response = AsyncMock()
    # Structure: seasons -> season_num -> episode_num -> [translations]
    mock_response.json.return_value = {
        'results': [{
            'link': 'http://video',
            'seasons': {
                '1': {
                    '1': [{'id': 't1', 'title': 'Voice', 'type': 'voice'}],
                    '2': [{'id': 't2', 'title': 'Voice', 'type': 'voice'}]
                }
            }
        }]
    }
    mock_response.raise_for_status = lambda: None
    
    service.client.post = AsyncMock(return_value=mock_response)
    service.api_key = "test_key" # Ensure key is set for test

    # Mock Notification Service to avoid DB constraints on user/favorites during simple service test
    with patch('app.services.parsers.kodik.notification_service.notify_users_new_episode', new_callable=AsyncMock) as mock_notify:
        
        await service.sync_ongoing_releases(db_session)
        
        # Refresh anime
        await db_session.refresh(ongoing_anime)
        
        # Expect episodes updated to 2
        assert ongoing_anime.episodes_aired == 2
        
        # Expect notification trigger
        assert mock_notify.called
        assert mock_notify.call_args[0][3] == 2 # episode number
