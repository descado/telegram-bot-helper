FROM locustio/locust

RUN pip install \
    opentelemetry-api \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp \
    opentelemetry-instrumentation-requests \
    opentelemetry-instrumentation-urllib3


COPY ./locustfile.py /home/locust/
COPY ./tracing_setup.py /home/locust/

ENV OTEL_SERVICE_NAME=locust-load-test
ENV OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger:4318/v1/traces
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf