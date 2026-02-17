import pytest
from httpx import AsyncClient
from app.api.v1.endpoints.parsers import merge_search_results, merge_full_data

def test_merge_logic_priority():
    shiki_res = [{'id': 1, 'russian': 'Title RU', 'name': 'Title EN', 'kind': 'tv', 'score': 8.5}]
    kodik_res = [{'id': 'k1', 'title': 'Title RU', 'title_orig': 'Title EN', 'type': 'anime'}]
    
    merged = merge_search_results(kodik_res, shiki_res)
    assert len(merged) == 1
    assert merged[0]['shikimori_id'] == '1'
    assert merged[0]['kodik_id'] == 'k1'
    assert merged[0]['sources']['kodik'] is True

def test_full_data_normalization():
    shiki = {'russian': 'RU', 'name': 'EN', 'kind': 'tv', 'episodes': 12, 'aired_on': '2024-01-01'}
    kodik = {'title': 'RU', 'title_orig': 'EN', 'type': 'anime'}
    
    merged = merge_full_data(shiki, kodik)
    assert merged['title'] == 'RU'
    assert merged['slug'] == 'en'
    assert merged['year'] == 2024

@pytest.mark.asyncio
async def test_settings_flow(client: AsyncClient):
    # This assumes we have an admin token, testing schema/unauthorized first
    response = await client.get("/api/v1/dashboard/parsers/settings")
    assert response.status_code in [200, 401, 403]
