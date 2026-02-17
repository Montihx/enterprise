
import pytest
from app.services.parsers.shikimori import ShikimoriParserService
from app.services.parsers.kodik import KodikParserService
from app.api.v1.endpoints.parsers import merge_search_results, merge_full_data

@pytest.mark.asyncio
async def test_merge_search_results():
    kodik = [
        {'id': '100', 'title': 'Attack on Titan', 'title_orig': 'Shingeki no Kyojin', 'type': 'anime', 'year': 2013}
    ]
    shiki = [
        {'id': 200, 'russian': 'Attack on Titan', 'name': 'Shingeki no Kyojin', 'kind': 'tv', 'score': 9.0}
    ]
    
    merged = merge_search_results(kodik, shiki)
    
    assert len(merged) == 1
    assert merged[0]['kodik_id'] == '100'
    assert merged[0]['shikimori_id'] == 200
    assert merged[0]['sources']['kodik'] is True
    assert merged[0]['sources']['shikimori'] is True

@pytest.mark.asyncio
async def test_merge_search_results_no_match():
    kodik = [{'id': '100', 'title': 'Kodik Exclusive', 'title_orig': 'Kodik Orig'}]
    shiki = [{'id': 200, 'russian': 'Shiki Exclusive', 'name': 'Shiki Orig'}]
    
    merged = merge_search_results(kodik, shiki)
    
    assert len(merged) == 2
    
    # Check Kodik only item
    k_item = next(i for i in merged if i['kodik_id'] == '100')
    assert k_item['shikimori_id'] is None
    
    # Check Shiki only item
    s_item = next(i for i in merged if i['shikimori_id'] == 200)
    assert s_item['kodik_id'] is None

@pytest.mark.asyncio
async def test_merge_full_data():
    k_data = {'id': 'k1', 'title': 'KTitle', 'screenshots': ['shot1.jpg']}
    s_data = {'id': 999, 'russian': 'STitle', 'image': {'original': '/poster.jpg'}, 'score': 8.5}
    
    merged = merge_full_data(k_data, s_data)
    
    assert merged['title'] == 'STitle' # Shiki priority
    assert merged['poster_url'] == 'https://shikimori.one/poster.jpg'
    assert merged['score'] == 8.5
    assert merged['kodik_id'] == 'k1'
    assert merged['shikimori_id'] == 999
