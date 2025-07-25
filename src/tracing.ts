// src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// URL нашего Jaeger коллектора внутри Docker-сети
const jaegerUrl = 'http://jaeger:4318/v1/traces';

const traceExporter = new OTLPTraceExporter({
    url: jaegerUrl,
});

const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: 'telegram-analytics-service', // Имя нашего сервиса, которое будет видно в Jaeger
});

// Изящное завершение работы SDK при остановке приложения
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});

// Запускаем SDK
try {
    sdk.start();
    console.log('Tracing initialized');
} catch (error) {
    console.log('Error initializing tracing', error);
}