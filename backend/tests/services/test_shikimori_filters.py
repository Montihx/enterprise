
import pytest
from app.services.parsers.shikimori import ShikimoriParserService

@pytest.fixture
def parser():
    return ShikimoriParserService()

def test_filter_score(parser):
    item = {'score': '5.5'}
    details = {}
    
    # Pass
    assert parser._passes_filters(item, details, {'min_score': 5.0}) is True
    # Fail
    assert parser._passes_filters(item, details, {'min_score': 6.0}) is False

def test_filter_year(parser):
    import datetime
    current_year = datetime.datetime.now().year
    
    item_this_year = {'aired_on': f'{current_year}-01-01'}
    item_old = {'aired_on': '1999-01-01'}
    details = {}
    
    config = {'this_year': True}
    
    assert parser._passes_filters(item_this_year, details, config) is True
    assert parser._passes_filters(item_old, details, config) is False

def test_filter_lgbt(parser):
    item = {}
    # Shikimori genres structure in details
    details_yaoi = {'genres': [{'name': 'Yaoi'}, {'name': 'Action'}]}
    details_clean = {'genres': [{'name': 'Action'}, {'name': 'Comedy'}]}
    
    config_allow = {'if_lgbt': True}
    config_block = {'if_lgbt': False}
    
    # Allow LGBT
    assert parser._passes_filters(item, details_yaoi, config_allow) is True
    
    # Block LGBT
    assert parser._passes_filters(item, details_yaoi, config_block) is False
    assert parser._passes_filters(item, details_clean, config_block) is True

def test_filter_episodes(parser):
    item = {'episodes': 12}
    details = {}
    
    assert parser._passes_filters(item, details, {'min_episodes': 1, 'max_episodes': 24}) is True
    assert parser._passes_filters(item, details, {'min_episodes': 13}) is False
    assert parser._passes_filters(item, details, {'max_episodes': 10}) is False

def test_filter_rating(parser):
    item = {'rating': 'r'}
    details = {}
    
    assert parser._passes_filters(item, details, {'ratings': ['r', 'pg_13']}) is True
    assert parser._passes_filters(item, details, {'ratings': ['pg']}) is False
    # If config ratings is empty, it should allow all (or logic dependent)
    # Current implementation: if allowed_ratings exists, check it.
    assert parser._passes_filters(item, details, {'ratings': []}) is True
