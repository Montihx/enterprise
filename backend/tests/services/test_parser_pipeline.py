import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.parsers.shikimori import ShikimoriParserService
from app.crud.crud_parser import parser_job as crud_jobs
from app.crud.crud_anime import anime as crud_anime
from app.models.parser import ParserJob
from uuid import uuid4

@pytest.fixture
def mock_shiki_node():
    return {
        'id': 777,
        'name': 'Pipeline Test Anime',
        'russian': 'Тестовый Пайплайн',
        'kind': 'tv',
        'status': 'released',
        'score': '8.8',
        'episodes': 24,
        'aired_on': '2024-05-01',
        'image': {'original': '/posters/test.jpg'},
        'description': 'Integration testing for the ingestion core.',
        'genres': [{'name': 'Sci-Fi', 'russian': 'Сай-фай'}],
        'studios': [{'name': 'Test Node Studio'}]
    }

@pytest.mark.asyncio
async def test_parser_ingestion_lifecycle(db_session, mock_shiki_node):
    """
    Test the full Content Ingestion Lifecycle:
    1. Remote node discovery
    2. Metadata reconciliation
    3. Asset localization (mocked)
    4. Registry persistence
    """
    # 1. Initialize Job
    job = await crud_jobs.create(db_session, obj_in={
        "parser_name": "shikimori",
        "job_type": "full_sync"
    })

    service = ShikimoriParserService()
    
    # 2. Setup Mock Responses
    mock_list = AsyncMock()
    mock_list.json.return_value = [mock_shiki_node]
    mock_list.raise_for_status = lambda: None

    mock_detail = AsyncMock()
    mock_detail.json.return_value = mock_shiki_node
    mock_detail.raise_for_status = lambda: None

    service.client.get = AsyncMock(side_effect=[
        mock_list, 
        mock_detail,
        AsyncMock(json=lambda: [], raise_for_status=lambda: None) # End loop
    ])

    # 3. Mock Media Engine
    with patch('app.services.parsers.shikimori.media_service.process_image', new_callable=AsyncMock) as mock_media:
        mock_media.return_value = "http://cdn.local/media/anime/pipeline-test.webp"
        
        # 4. Trigger Orchestration
        config = {'min_score': 7.0, 'localize_images': True}
        await service.run_full_sync(db_session, str(job.id), config)

        # 5. Verify Core Persistence
        anime = await crud_anime.get_by_shikimori_id(db_session, shikimori_id=777)
        assert anime is not None
        assert anime.title == "Тестовый Пайплайн"
        assert anime.poster_url == "http://cdn.local/media/anime/pipeline-test.webp"
        
        # 6. Verify Job Telemetry
        await db_session.refresh(job)
        assert job.status == 'completed'
        assert job.items_created == 1
        assert job.progress == 100
