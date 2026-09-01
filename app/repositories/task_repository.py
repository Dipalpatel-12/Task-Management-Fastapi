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


def get_all_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    status_filter: str | None = None,
    priority_filter: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
):
    query = db.query(Task).filter(Task.deleted_at.is_(None))

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

    sort_column = getattr(Task, sort_by, Task.created_at)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return query.offset(skip).limit(limit).all()



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