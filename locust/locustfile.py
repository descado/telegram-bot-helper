# locust/locustfile.py
from locust import HttpUser, task, between
import random
from tracing_setup import setup_tracing
from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

# Инициализируем трассировку при запуске
tracer = setup_tracing()
propagator = TraceContextTextMapPropagator()

class ApiUser(HttpUser):
    # Пользователи будут ждать от 1 до 2 секунд между выполнением задач
    wait_time = between(1, 2)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tracer = trace.get_tracer(__name__)

    def make_request_with_tracing(self, method, endpoint, **kwargs):
        """Обертка для HTTP запросов с трассировкой"""
        with self.tracer.start_as_current_span(f"{method.upper()} {endpoint}") as span:
            # Добавляем атрибуты к спану
            span.set_attribute("http.method", method.upper())
            span.set_attribute("http.url", f"{self.host}{endpoint}")
            span.set_attribute("user.type", "load_test")
            
            # Создаем заголовки для передачи trace context
            headers = kwargs.get('headers', {})
            
            # Внедряем trace context в заголовки
            carrier = {}
            propagator.inject(carrier)
            headers.update(carrier)
            
            kwargs['headers'] = headers
            
            try:
                # Выполняем запрос
                if method.lower() == 'get':
                    response = self.client.get(endpoint, **kwargs)
                elif method.lower() == 'post':
                    response = self.client.post(endpoint, **kwargs)
                
                # Добавляем информацию о результате в спан
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute("http.response_size", len(response.content))
                
                if response.status_code >= 400:
                    span.set_status(trace.Status(trace.StatusCode.ERROR, f"HTTP {response.status_code}"))
                
                return response
                
            except Exception as e:
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                span.record_exception(e)
                raise

    # --- ЗАДАЧА №1: Нагрузка на запись (для теста RPS) ---
    @task(10) # Эта задача будет выполняться в 10 раз чаще, чем другие
    def log_message(self):
        with self.tracer.start_as_current_span("log_message_task") as span:
            chat_id = random.randint(1, 1000)
            user_id = random.randint(1, 1000)
            
            # Добавляем атрибуты задачи
            span.set_attribute("task.name", "log_message")
            span.set_attribute("test.chat_id", chat_id)
            span.set_attribute("test.user_id", user_id)
            
            headers = {'Content-Type': 'application/json'}
            payload = {
                "botId": "locust-test",
                "chatId": chat_id,
                "userId": user_id,
                "text": "load test from locust"
            }
            
            self.make_request_with_tracing('post', '/api/log', json=payload, headers=headers)

    # --- ЗАДАЧА №2: Нагрузка на "медленный" поиск (для теста Latency) ---
    @task(1) # Эта задача будет выполняться редко
    def search_message(self):
        with self.tracer.start_as_current_span("search_message_task") as span:
            span.set_attribute("task.name", "search_message")
            span.set_attribute("test.query", "locust")
            
            self.make_request_with_tracing('get', '/api/search?textQuery=locust')

    # --- ЗАДАЧА №3: Проверка статистики ---
    @task(2) # Эта задача будет выполняться в 2 раза чаще, чем поиск
    def get_stats(self):
        with self.tracer.start_as_current_span("get_stats_task") as span:
            span.set_attribute("task.name", "get_stats")
            span.set_attribute("test.bot_id", "locust-test")
            
            self.make_request_with_tracing('get', '/api/stats/locust-test')

    def on_start(self):
        with self.tracer.start_as_current_span("user_session_start") as span:
            span.set_attribute("event.type", "user_start")
            span.set_attribute("user.session", "starting")
            print("Starting load test with tracing...")