from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.task import Task, StatusEnum
from app.schemas.task import TaskCreate, TaskUpdate
from app.repositories import task_repository


VALID_TRANSITIONS = {
    StatusEnum.TODO: [StatusEnum.IN_PROGRESS, StatusEnum.CANCELLED],
    StatusEnum.IN_PROGRESS: [StatusEnum.COMPLETED, StatusEnum.CANCELLED],
    StatusEnum.COMPLETED: [],
    StatusEnum.CANCELLED: [],
}


def create_task(db: Session, task_data: TaskCreate) -> Task:
    return task_repository.create_task(db, task_data)


def get_task(db: Session, task_id: int) -> Task:
    task = task_repository.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task
def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    status_filter: str = None,
    priority_filter: str = None,
    due_date_from=None,
    due_date_to=None,
    hours_min: float = None,
    hours_max: float = None,
    sort_by: str = "created_at",
    order: str = "desc",
):
    tasks = task_repository.get_all_tasks(
        db, skip, limit, search, status_filter, priority_filter,
        due_date_from, due_date_to, hours_min, hours_max, sort_by, order
    )
    total = task_repository.count_tasks(
        db, search, status_filter, priority_filter,
        due_date_from, due_date_to, hours_min, hours_max
    )
    return {"items": tasks, "total": total}


def update_task(db: Session, task_id: int, update_data: TaskUpdate) -> Task:
    task = get_task(db, task_id)
    return task_repository.update_task(db, task, update_data)


def delete_task(db: Session, task_id: int) -> Task:
    task = get_task(db, task_id)
    return task_repository.soft_delete_task(db, task)


def change_status(db: Session, task_id: int, new_status: StatusEnum) -> Task:
    task = get_task(db, task_id)
    allowed = VALID_TRANSITIONS.get(task.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change status from {task.status.value} to {new_status.value}"
        )
    task.status = new_status
    db.commit()
    db.refresh(task)
    return task


def change_priority(db: Session, task_id: int, new_priority):
    task = get_task(db, task_id)
    task.priority = new_priority
    db.commit()
    db.refresh(task)
    return task


def get_task_stats(db: Session) -> dict:
    return task_repository.get_status_counts(db)


def toggle_star(db: Session, task_id: int) -> Task:
    task = get_task(db, task_id)
    return task_repository.toggle_star(db, task)