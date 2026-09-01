from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.models.task import StatusEnum, PriorityEnum
from app.services import task_service

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    return task_service.create_task(db, task_data)


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    status_filter: StatusEnum = None,
    priority_filter: PriorityEnum = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
):
    return task_service.get_tasks(db, skip, limit, search, status_filter, priority_filter, sort_by, order)


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