def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()

    # Basic expectations about the seeded activities
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert isinstance(data["Chess Club"]["participants"], list)