from datetime import datetime, timedelta, timezone
import random
from sqlalchemy import select
from .db import Document, Conversation, Config
from .rag import index_document

FAQS = [
    ('Доставка и самовывоз', 'Сколько стоит доставка? Стоимость доставки зависит от города. Москва от 500 рублей. По России — от 700 рублей. Бесплатная доставка при заказе от 10 000 рублей. Срок доставки по Москве — 1–2 рабочих дня, по России — 3–7 дней. Самовывоз: Москва, ул. Лесная, 7, с 10:00 до 20:00.'),
    ('Возврат и обмен', 'Как вернуть товар? Вы можете вернуть товар в течение 14 дней после получения, если сохранены товарный вид и упаковка. Напишите номер заказа менеджеру. Деньги возвращаются на карту в течение 5–10 рабочих дней.'),
    ('Оплата и оформление заказа', 'Как оплатить заказ? Принимаем банковские карты, СБП и оплату по счету для юридических лиц. Чтобы оформить заказ, оставьте заявку — менеджер уточнит товары, адрес и удобное время доставки.'),
    ('Каталог и наличие товаров', 'Есть ли в наличии светильник? Светильник Luna стоит 4 900 рублей, плед Nordic — 3 200 рублей, ваза Arc — 2 800 рублей. Наличие конкретного цвета уточнит менеджер. На товары предоставляется гарантия 12 месяцев.'),
    ('О компании и контакты', 'NORD HOME — магазин предметов интерьера. Мы работаем ежедневно с 10:00 до 20:00 по Москве. Поддержка: hello@nordhome.example. Адрес шоурума: Москва, ул. Лесная, 7.'),
    ('Отслеживание заказа', 'Где мой заказ? Для проверки статуса доставки напишите номер заказа. Менеджер проверит отправление и пришлет трек-номер. Персональные данные о заказе AI не придумывает.')
]


def seed(db):
    if db.get(Config, 1):
        return
    db.add(Config(id=1, value={'company': 'NORD HOME', 'tone': 'friendly', 'language': 'ru', 'handoff': True, 'greeting': 'Здравствуйте! Я AI-ассистент NORD HOME. Чем могу помочь?'}))
    for i, (title, content) in enumerate(FAQS):
        doc = Document(id=f'demo-doc-{i}', title=title, content=content, kind=['pdf', 'pdf', 'faq', 'url', 'url', 'faq'][i], source='Демонстрационный материал')
        db.add(doc)
        db.flush()
        index_document(db, doc)
    rng = random.Random(42)
    names = ['Анна Смирнова', 'Михаил Волков', 'Екатерина Орлова', 'Дмитрий Соколов', 'Мария Кузнецова', 'Алексей Петров', 'Полина Морозова', 'Илья Новиков', 'София Белова', 'Артём Козлов', 'Виктория Попова', 'Максим Лебедев']
    questions = ['Сколько стоит доставка в Москву?', 'Как вернуть товар?', 'Хочу оформить заказ', 'Есть ли в наличии светильник Luna?', 'Во сколько открывается шоурум?', 'Где мой заказ №1042?']
    topics = ['Доставка', 'Возврат', 'Заказ', 'Наличие', 'Другое', 'Заказ']
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for day in range(30):
        count = rng.randint(36, 68) + (30 - day) // 3
        for j in range(count):
            idx = rng.choices(range(6), weights=[38, 13, 16, 17, 7, 9])[0]
            name = rng.choice(names)
            created = now - timedelta(days=day, minutes=j * 7 + 2)
            status = 'handoff' if idx in [2, 5] else 'resolved'
            answer = FAQS[idx][1] if idx != 2 else 'Создал заявку. Менеджер получил уведомление.'
            db.add(Conversation(id=f'demo-{day}-{j}', name=name, handle='@' + ['anna_s', 'm_volkov', 'kate_o', 'd_sokolov'][j % 4], status=status, topic=topics[idx], response_seconds=round(rng.uniform(.7, 2), 2), created_at=created, messages=[{'role': 'user', 'text': questions[idx], 'time': created.isoformat()}, {'role': 'assistant', 'text': answer, 'time': (created + timedelta(seconds=1.2)).isoformat(), 'sources': [FAQS[idx][0]]}]))
    db.commit()
