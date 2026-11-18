import os
import tempfile
from pathlib import Path
import pytest

TEST_DB = Path(tempfile.mkdtemp(prefix='forma-tests-')) / 'test.db'
os.environ['DATABASE_URL'] = 'sqlite:///' + TEST_DB.as_posix()
os.environ['DEMO_MODE'] = 'true'
os.environ['LLM_API_KEY'] = ''
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.db import Session, Lead, Document, Chunk
from sqlalchemy import select


@pytest.fixture(scope='module')
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_dashboard_consistent_totals(client):
    data = client.get('/api/dashboard?days=7').json()
    assert data['total'] > 100
    assert sum(x['total'] for x in data['series']) == data['total']
    assert sum(x['resolved'] for x in data['series']) == data['resolved']
    assert sum(x['count'] for x in data['topics']) == data['total']
    assert len(data['series']) == 7
    assert client.get('/api/dashboard?days=0').status_code == 422


def test_delivery_uses_knowledge_and_persists(client):
    result = client.post('/api/chat', json={'message': 'Сколько стоит доставка?'}).json()
    assert 'Москва от 500 рублей' in result['answer']
    assert 'Доставка и самовывоз' in result['sources']
    rows = client.get('/api/conversations?q=Сколько стоит доставка').json()
    assert any(c['id'] == result['conversation_id'] for c in rows)


def test_order_creates_real_demo_lead(client):
    response = client.post('/api/chat', json={'message': 'Хочу оформить заказ'})
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'handoff'
    assert data['answer'] == 'Создал заявку. Менеджер получил уведомление.'
    with Session() as db:
        lead = db.get(Lead, data['lead_id'])
        assert lead.notification == 'demo'
        assert lead.conversation_id == data['conversation_id']


def test_new_faq_is_searchable_then_removed_from_retrieval(client):
    response = client.post('/api/documents', json={'title': 'Сборка мебели', 'content': 'Сборка мебели стоит 1700 рублей. Монтаж выполняется по субботам.'})
    assert response.status_code == 200
    doc = response.json()
    assert doc['status'] == 'ready' and doc['chunks'] > 0
    answer = client.post('/api/chat', json={'message': 'Сколько стоит сборка мебели?'}).json()
    assert '1700' in answer['answer']
    assert 'Сборка мебели' in answer['sources']
    assert client.delete('/api/documents/' + doc['id']).status_code == 200
    with Session() as db:
        assert not db.get(Document, doc['id'])
        assert not db.scalars(select(Chunk).where(Chunk.document_id == doc['id'])).all()


def test_unknown_question_does_not_hallucinate(client):
    data = client.post('/api/chat', json={'message': 'Квантовая запутанность нейтрино'}).json()
    assert 'нет точного ответа' in data['answer']
    assert data['sources'] == [] and data['status'] == 'open'


def test_manual_resolution_is_not_counted_as_ai(client):
    c = client.post('/api/chat', json={'message': 'Хочу оформить заказ'}).json()
    before = client.get('/api/dashboard').json()['resolved']
    response = client.patch('/api/conversations/' + c['conversation_id'] + '/resolve')
    assert response.json()['status'] == 'closed'
    assert client.get('/api/dashboard').json()['resolved'] == before


def test_settings_persist_and_handoff_can_be_disabled(client):
    original = client.get('/api/settings').json()
    new = {**original, 'company': 'Test Company', 'tone': 'brief', 'handoff': False}
    assert client.put('/api/settings', json=new).status_code == 200
    assert client.get('/api/settings').json()['company'] == 'Test Company'
    answer = client.post('/api/chat', json={'message': 'Хочу оформить заказ'}).json()
    assert not answer['lead_id']
    client.put('/api/settings', json=original)


def test_rejects_invalid_uploads_and_private_urls(client):
    assert client.post('/api/documents/upload', files={'file': ('x.pdf', b'not a pdf', 'application/pdf')}).status_code == 422
    assert client.post('/api/documents/upload', files={'file': ('x.pdf', b'%PDF' + b'0' * 10000000, 'application/pdf')}).status_code == 413
    assert client.post('/api/documents', json={'title': 'Private', 'url': 'https://127.0.0.1/private'}).status_code == 422
    assert client.post('/api/documents', json={'title': 'Private', 'url': 'http://example.com'}).status_code == 422
    assert client.post('/api/documents', json={'title': 'Metadata', 'url': 'https://169.254.169.254/'}).status_code == 422
    assert client.post('/api/documents', json={'title': 'Bad port', 'url': 'https://example.com:wrong/'}).status_code == 422


def test_pdf_text_is_indexed(client):
    from pypdf import PdfWriter
    from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
    import io
    writer = PdfWriter()
    page = writer.add_blank_page(width=595, height=842)
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
    page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
    stream = DecodedStreamObject()
    stream.set_data(b'BT /F1 12 Tf 50 780 Td (Furniture assembly costs 1700 rubles.) Tj ET')
    page[NameObject('/Contents')] = writer._add_object(stream)
    buffer = io.BytesIO()
    writer.write(buffer)
    response = client.post('/api/documents/upload', files={'file': ('assembly.pdf', buffer.getvalue(), 'application/pdf')})
    assert response.status_code == 200
    assert response.json()['chunks'] == 1
    client.delete('/api/documents/' + response.json()['id'])


def test_production_admin_gate_and_webhook_auth(client, monkeypatch):
    monkeypatch.setattr(settings, 'demo_mode', False)
    monkeypatch.setattr(settings, 'admin_api_key', 'test-admin-secret-at-least-24-chars')
    assert client.get('/api/conversations').status_code == 401
    assert client.get('/api/conversations', headers={'X-API-Key': settings.admin_api_key}).status_code == 200
    assert client.post('/api/telegram/webhook', json={'update_id': 1}).status_code == 403


def test_telegram_webhook_duplicate_does_not_duplicate_leads(client, monkeypatch):
    import app.main as main
    calls = []
    async def fake_telegram(method, data):
        calls.append((method, data))
        return {'message_id': 123}
    monkeypatch.setattr(main, 'telegram', fake_telegram)
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'test-secret')
    monkeypatch.setattr(settings, 'telegram_manager_chat_id', '456')
    payload = {'update_id': 10001, 'message': {'chat': {'id': 123}, 'from': {'first_name': 'Анна'}, 'text': 'Хочу оформить заказ'}}
    headers = {'X-Telegram-Bot-Api-Secret-Token': 'test-secret'}
    assert client.post('/api/telegram/webhook', json=payload, headers=headers).status_code == 200
    assert client.post('/api/telegram/webhook', json=payload, headers=headers).json()['duplicate']
    assert len(calls) == 2
    with Session() as db:
        leads = db.scalars(select(Lead).where(Lead.conversation_id == 'tg-123')).all()
        assert len(leads) == 1 and leads[0].notification == 'sent'


def test_llm_failure_is_explicit_and_does_not_save_partial_chat(client, monkeypatch):
    import httpx
    import app.main as main
    monkeypatch.setattr(settings, 'llm_api_key', 'test-only')
    async def fail(*args, **kwargs):
        raise httpx.ConnectError('test')
    monkeypatch.setattr(httpx.AsyncClient, 'post', fail)
    response = client.post('/api/chat', json={'message': 'Сколько стоит доставка?', 'name': 'LLMFailureTest'})
    assert response.status_code == 502
    assert client.get('/api/conversations?q=LLMFailureTest').json() == []
