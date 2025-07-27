from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.urllib3 import URLLib3Instrumentor
from opentelemetry.sdk.resources import Resource
import os

def setup_tracing():
    """Настройка OpenTelemetry трассировки для Locust"""
    
    # Создаем ресурс с информацией о сервисе
    resource = Resource.create({
        "service.name": os.getenv("OTEL_SERVICE_NAME", "locust-load-test"),
        "service.version": "1.0.0",
    })
    
    # Настраиваем провайдер трейсов
    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer_provider = trace.get_tracer_provider()
    
    # Настраиваем экспортер в Jaeger
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "http://jaeger:4318/v1/traces"),
        headers={}
    )
    
    # Добавляем процессор спанов
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # Автоматически инструментируем HTTP запросы
    RequestsInstrumentor().instrument()
    URLLib3Instrumentor().instrument()
    
    print("OpenTelemetry tracing initialized for Locust")
    
    return trace.get_tracer(__name__)