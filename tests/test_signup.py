def test_signup_adds_participant(client):
    resp = client.post('/activities/Chess Club/signup?email=testuser@example.com')
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    data = client.get('/activities').json()
    participants = [p.lower() for p in data['Chess Club']['participants']]
    assert 'testuser@example.com' in participants


def test_signup_rejects_duplicate_entries(client):
    r1 = client.post('/activities/Chess Club/signup?email=dup@example.com')
    assert r1.status_code == 200
    r2 = client.post('/activities/Chess Club/signup?email=dup@example.com')
    assert r2.status_code == 400


def test_signup_nonexistent_activity_returns_404(client):
    resp = client.post('/activities/DoesNotExist/signup?email=a@b.com')
    assert resp.status_code == 404