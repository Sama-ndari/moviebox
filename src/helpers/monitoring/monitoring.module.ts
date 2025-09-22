import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'METRICS',
      useValue: {
        httpRequestDurationMicroseconds: new Map(),
        httpRequestsTotal: new Map(),
        recordRequest: function(method: string, route: string, statusCode: number, duration: number) {
          const key = `${method}_${route}_${statusCode}`;
          this.httpRequestsTotal.set(key, (this.httpRequestsTotal.get(key) || 0) + 1);
          this.httpRequestDurationMicroseconds.set(key, (this.httpRequestDurationMicroseconds.get(key) || 0) + duration);
        },
        getMetrics: function() {
          return {
            http_requests_total: Array.from(this.httpRequestsTotal.entries()).map(([key, value]) => ({
              key,
              value
            })),
            http_request_duration_microseconds: Array.from(this.httpRequestDurationMicroseconds.entries()).map(([key, value]) => ({
              key,
              value
            }))
          };
        }
      }
    }
  ],
  exports: ['METRICS']
})
export class MonitoringModule {}
