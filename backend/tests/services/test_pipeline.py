import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.parsers.shikimori import ShikimoriParserService
from app.services.parsers.kodik import KodikParserService
from app.crud.crud_parser import parser_job as crud_jobs
from app.crud.crud_anime import anime as crud_anime
from app.models.parser import ParserJob
from uuid import uuid4
from datetime import date

@pytest.fixture
def mock_shiki_data():
    return {
        'id': 12345,
        'name': 'Pipeline Test',
        'russian': 'Тест Пайплайна',
        'kind': 'tv',
        'status': 'released',
        'score': '9.5',
        'episodes': 12,
        'aired_on': '2024-01-01',
        'image': {'original': '/test.jpg'},
        'description': 'End-to-end system validation.',
        'genres': [{'name': 'Action', 'russian': 'Экшен'}],
        'studios': [{'name': 'Test Studio'}]
    }

@pytest.mark.asyncio
async def test_full_ingestion_pipeline(db_session, mock_shiki_data):
    """
    Validates the entire ingestion lifecycle:
    1. Discovery via Shikimori
    2. Filtering logic
    3. Asset optimization via MediaService
    4. Database persistence
    """
    job = await crud_jobs.create(db_session, obj_in={
        "parser_name": "shikimori",
        "job_type": "full_sync"
    })

    service = ShikimoriParserService()
    
    # 1. Mock API Responses
    mock_res_list = AsyncMock()
    mock_res_list.json.return_value = [mock_shiki_data]
    mock_res_list.raise_for_status = lambda: None

    mock_res_detail = AsyncMock()
    mock_res_detail.json.return_value = mock_shiki_data
    mock_res_detail.raise_for_status = lambda: None

    # Sequential return to handle page loop then detail fetch
    service.client.get = AsyncMock(side_effect=[
        mock_res_list, 
        mock_res_detail,
        AsyncMock(json=lambda: [], raise_for_status=lambda: None)
    ])

    # 2. Mock Media Service to avoid physical I/O
    with patch('app.services.parsers.shikimori.media_service.process_image', new_callable=AsyncMock) as mock_media:
        mock_media.return_value = "http://localhost/media/test.webp"
        
        # 3. Trigger Sync
        config = {'min_score': 8.0, 'if_lgbt': True, 'if_camrip': False}
        await service.run_full_sync(db_session, str(job.id), config)

        # 4. Verify Persistence
        anime = await crud_anime.get_by_shikimori_id(db_session, shikimori_id=12345)
        assert anime is not None
        assert anime.title == "Тест Пайплайна"
        assert anime.score == 9.5
        assert anime.poster_url == "http://localhost/media/test.webp"
        
        # 5. Verify Job State
        await db_session.refresh(job)
        assert job.status == 'completed'
        assert job.items_created == 1
        assert job.progress == 100

@pytest.mark.asyncio
async def test_duplicate_collision_handling(db_session, mock_shiki_data):
    """Ensure that the pipeline correctly identifies and updates existing nodes."""
    # Create initial node
    await crud_anime.create(db_session, obj_in={
        "shikimori_id": 12345,
        "title": "Old Title",
        "slug": "pipeline-test"
    })

    job = await crud_jobs.create(db_session, obj_in={"parser_name": "shikimori", "job_type": "incremental"})
    service = ShikimoriParserService()
    
    mock_res_list = AsyncMock()
    mock_res_list.json.return_value = [mock_shiki_data]
    
    service.client.get = AsyncMock(side_effect=[
        mock_res_list,
        AsyncMock(json=lambda: mock_shiki_data, raise_for_status=lambda: None),
        AsyncMock(json=lambda: [], raise_for_status=lambda: None)
    ])

    # Trigger update sync
    await service.run_incremental_sync(db_session, str(job.id), {"auto_update": True})

    # Verify update
    anime = await crud_anime.get_by_shikimori_id(db_session, shikimori_id=12345)
    assert anime.title == "Тест Пайплайна" # Updated from "Old Title"
    
    await db_session.refresh(job)
    assert job.items_updated == 1
