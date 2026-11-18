from datetime import datetime, timezone
from sqlalchemy import create_engine, String, Text, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from .config import settings

engine = create_engine(settings.database_url, connect_args={'check_same_thread': False} if settings.database_url.startswith('sqlite') else {}, pool_pre_ping=True)
Session = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Document(Base):
    __tablename__ = 'documents'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default='ready')
    source: Mapped[str] = mapped_column(String, default='')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Chunk(Base):
    __tablename__ = 'chunks'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey('documents.id', ondelete='CASCADE'), index=True)
    text: Mapped[str] = mapped_column(Text)
    vector: Mapped[dict] = mapped_column(JSON)


class Conversation(Base):
    __tablename__ = 'conversations'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    handle: Mapped[str] = mapped_column(String, default='')
    status: Mapped[str] = mapped_column(String, default='resolved')
    topic: Mapped[str] = mapped_column(String, default='Другое')
    messages: Mapped[list] = mapped_column(JSON, default=list)
    response_seconds: Mapped[float] = mapped_column(Float, default=1.2)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Config(Base):
    __tablename__ = 'config'
    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    value: Mapped[dict] = mapped_column(JSON)


class Lead(Base):
    __tablename__ = 'leads'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    request: Mapped[str] = mapped_column(Text)
    notification: Mapped[str] = mapped_column(String, default='demo')


class TelegramUpdate(Base):
    __tablename__ = 'telegram_updates'
    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String, default='processing')
