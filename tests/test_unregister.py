def test_unregister_removes_participant(client):
    # add then remove
    client.post('/activities/Chess Club/signup?email=remove@example.com')
    resp = client.delete('/activities/Chess Club/signup?email=remove@example.com')
    assert resp.status_code == 200

    data = client.get('/activities').json()
    parts = [p.lower() for p in data['Chess Club']['participants']]
    assert 'remove@example.com' not in parts


def test_unregister_missing_returns_404(client):
    resp = client.delete('/activities/Chess Club/signup?email=missing@example.com')
    assert resp.status_code == 404