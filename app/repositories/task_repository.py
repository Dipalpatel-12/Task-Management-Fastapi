from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from datetime import datetime
from sqlalchemy import or_


def create_task(db: Session, task_data: TaskCreate) -> Task:
    new_task = Task(**task_data.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def get_task_by_id(db: Session, task_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id, Task.deleted_at.is_(None)).first()


def _apply_filters(query, search, status_filter, priority_filter, due_date_from, due_date_to, hours_min, hours_max):
    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%"),
            )
        )
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if due_date_from:
        query = query.filter(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(Task.due_date <= due_date_to)
    if hours_min is not None:
        query = query.filter(Task.estimated_hours >= hours_min)
    if hours_max is not None:
        query = query.filter(Task.estimated_hours <= hours_max)
    return query


def get_all_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    status_filter: str | None = None,
    priority_filter: str | None = None,
    due_date_from: datetime | None = None,
    due_date_to: datetime | None = None,
    hours_min: float | None = None,
    hours_max: float | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
):
    query = db.query(Task).filter(Task.deleted_at.is_(None))
    query = _apply_filters(query, search, status_filter, priority_filter, due_date_from, due_date_to, hours_min, hours_max)

    sort_column = getattr(Task, sort_by, Task.created_at)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return query.offset(skip).limit(limit).all()


def count_tasks(
    db: Session,
    search: str | None = None,
    status_filter: str | None = None,
    priority_filter: str | None = None,
    due_date_from: datetime | None = None,
    due_date_to: datetime | None = None,
    hours_min: float | None = None,
    hours_max: float | None = None,
):
    query = db.query(Task).filter(Task.deleted_at.is_(None))
    query = _apply_filters(query, search, status_filter, priority_filter, due_date_from, due_date_to, hours_min, hours_max)
    return query.count()


def update_task(db: Session, task: Task, update_data: TaskUpdate) -> Task:
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def soft_delete_task(db: Session, task: Task) -> Task:
    task.deleted_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task