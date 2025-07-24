# locust/locustfile.py
from locust import HttpUser, task, between
import random

class ApiUser(HttpUser):
    # Пользователи будут ждать от 1 до 2 секунд между выполнением задач
    wait_time = between(1, 2)

    # --- ЗАДАЧА №1: Нагрузка на запись (для теста RPS) ---
    @task(10) # Эта задача будет выполняться в 10 раз чаще, чем другие
    def log_message(self):
        headers = {'Content-Type': 'application/json'}
        payload = {
            "botId": "locust-test",
            "chatId": random.randint(1, 1000),
            "userId": random.randint(1, 1000),
            "text": "load test from locust"
        }
        self.client.post("/api/log", json=payload, headers=headers)

    # --- ЗАДАЧА №2: Нагрузка на "медленный" поиск (для теста Latency) ---
    @task(1) # Эта задача будет выполняться редко
    def search_message(self):
        # Сначала наполняем базу, чтобы поиск был медленным
        # В реальном тесте это лучше вынести в setup, но для ДЗ так проще
        self.client.get("/api/search?textQuery=locust")

    # --- ЗАДАЧА №3: Проверка статистики ---
    @task(2) # Эта задача будет выполняться в 2 раза чаще, чем поиск
    def get_stats(self):
        self.client.get("/api/stats/locust-test")

    def on_start(self):
        print("Starting load test...")