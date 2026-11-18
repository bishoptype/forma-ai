"""Deterministic, inspectable lexical RAG. No model downloads or API key needed.

Chunks carry sparse term-frequency vectors in PostgreSQL JSON. Retrieval uses
cosine similarity with corpus IDF, then feeds cited context to an optional LLM.
The retriever is deliberately replaceable with pgvector + semantic embeddings.
"""
import math
import re
from collections import Counter
from uuid import uuid4
from sqlalchemy import select, delete
from .db import Chunk, Document

STOP = {'это', 'как', 'для', 'или', 'при', 'что', 'the', 'and', 'есть', 'можно', 'мне', 'вас', 'ваш'}


def vector(text: str) -> dict:
    words = re.findall(r'[a-zа-яё0-9]+', text.lower().replace('ё', 'е'))
    return dict(Counter(w[:6] if len(w) > 6 else w for w in words if len(w) > 2 and w not in STOP))


def index_document(db, doc):
    db.execute(delete(Chunk).where(Chunk.document_id == doc.id))
    for offset in range(0, len(doc.content), 650):
        text = doc.content[offset:offset + 850]
        db.add(Chunk(id=str(uuid4()), document_id=doc.id, text=text, vector=vector(text)))
    doc.status = 'ready'
    db.commit()


def retrieve(db, query, limit=3):
    rows = db.execute(select(Chunk, Document).join(Document, Chunk.document_id == Document.id).where(Document.status == 'ready')).all()
    q = vector(query)
    df = Counter(term for chunk, _ in rows for term in chunk.vector)
    idf = {term: math.log(1 + len(rows) / (1 + count)) for term, count in df.items()}
    def score(v):
        dot = sum(count * v.get(term, 0) * idf.get(term, 1) ** 2 for term, count in q.items())
        norm = math.sqrt(sum((count * idf.get(term, 1)) ** 2 for term, count in v.items()))
        qnorm = math.sqrt(sum((count * idf.get(term, 1)) ** 2 for term, count in q.items()))
        return dot / (norm * qnorm) if norm and qnorm else 0
    ranked = sorted([(score(c.vector), c, d) for c, d in rows], key=lambda row: row[0], reverse=True)
    return [{'id': d.id, 'title': d.title, 'text': c.text, 'score': round(s, 3)} for s, c, d in ranked[:limit] if s > .065]
