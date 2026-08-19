import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


# Keep an original snapshot of the in-memory activities so tests can reset state
ORIGINAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL_ACTIVITIES))
    yield