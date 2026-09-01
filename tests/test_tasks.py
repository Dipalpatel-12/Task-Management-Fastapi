def test_create_task_success(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "Test task",
        "estimated_hours": 2
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["status"] == "To Do"
    assert data["priority"] == "Medium"


def test_create_task_title_too_short(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "ab",
        "estimated_hours": 2
    })
    assert response.status_code == 422


def test_create_task_negative_hours(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "Valid title",
        "estimated_hours": -5
    })
    assert response.status_code == 422


def test_create_task_zero_hours(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "Valid title",
        "estimated_hours": 0
    })
    assert response.status_code == 422


def test_create_task_invalid_priority(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "Valid title",
        "priority": "SuperHigh",
        "estimated_hours": 2
    })
    assert response.status_code == 422


def test_get_task_by_id(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Fetch me", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_id


def test_get_task_not_found(client):
    response = client.get("/api/v1/tasks/9999")
    assert response.status_code == 404


def test_list_tasks(client):
    client.post("/api/v1/tasks/", json={"title": "Task A", "estimated_hours": 1})
    client.post("/api/v1/tasks/", json={"title": "Task B", "estimated_hours": 2})

    response = client.get("/api/v1/tasks/")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_update_task(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Old title", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    response = client.put(f"/api/v1/tasks/{task_id}", json={"title": "New title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New title"


def test_soft_delete_task(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Delete me", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    delete_res = client.delete(f"/api/v1/tasks/{task_id}")
    assert delete_res.status_code == 204

    list_res = client.get("/api/v1/tasks/")
    ids = [t["id"] for t in list_res.json()]
    assert task_id not in ids


def test_valid_status_transition(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Status task", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    response = client.patch(f"/api/v1/tasks/{task_id}/status", params={"new_status": "In Progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"


def test_invalid_status_transition(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Status task", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    client.patch(f"/api/v1/tasks/{task_id}/status", params={"new_status": "In Progress"})
    client.patch(f"/api/v1/tasks/{task_id}/status", params={"new_status": "Completed"})

    response = client.patch(f"/api/v1/tasks/{task_id}/status", params={"new_status": "To Do"})
    assert response.status_code == 400


def test_change_priority(client):
    create_res = client.post("/api/v1/tasks/", json={"title": "Priority task", "estimated_hours": 1})
    task_id = create_res.json()["id"]

    response = client.patch(f"/api/v1/tasks/{task_id}/priority", params={"new_priority": "Urgent"})
    assert response.status_code == 200
    assert response.json()["priority"] == "Urgent"