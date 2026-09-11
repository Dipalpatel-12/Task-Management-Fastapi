from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from datetime import datetime
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse, TaskStatsResponse
from app.models.task import StatusEnum, PriorityEnum
from app.services import task_service

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    task = task_service.create_task(db, task_data)
    return {
        "success": True,
        "status_code": status.HTTP_201_CREATED,
        "message": "Task created successfully",
        "data": TaskResponse.model_validate(task),
    }

@router.get("/", response_model=TaskListResponse)
def list_tasks(
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    status_filter: StatusEnum = None,
    priority_filter: PriorityEnum = None,
    due_date_from: datetime = None,
    due_date_to: datetime = None,
    hours_min: float = None,
    hours_max: float = None,
    sort_by: str = "created_at",
    order: str = "desc",
      is_starred: bool | None = None,
    db: Session = Depends(get_db),
):
    return task_service.get_tasks(
        db, skip, limit, search, status_filter, priority_filter,
        due_date_from, due_date_to, hours_min, hours_max, sort_by, order,
         is_starred
    )


@router.get("/stats", response_model=TaskStatsResponse)
def get_task_stats(db: Session = Depends(get_db)):
    return task_service.get_task_stats(db)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return task_service.get_task(db, task_id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    return task_service.update_task(db, task_id, task_data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task_service.delete_task(db, task_id)
    return None


@router.patch("/{task_id}/status", response_model=TaskResponse)
def change_task_status(task_id: int, new_status: StatusEnum, db: Session = Depends(get_db)):
    return task_service.change_status(db, task_id, new_status)


@router.patch("/{task_id}/priority", response_model=TaskResponse)
def change_task_priority(task_id: int, new_priority: PriorityEnum, db: Session = Depends(get_db)):
    return task_service.change_priority(db, task_id, new_priority)


@router.patch("/{task_id}/star", response_model=TaskResponse)
def toggle_task_star(task_id: int, db: Session = Depends(get_db)):
    return task_service.toggle_star(db, task_id)