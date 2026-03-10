import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      inject: [ConfigService, GeminiSummarizationProvider, FakeSummarizationProvider],
      useFactory: (
        config: ConfigService,
        gemini: GeminiSummarizationProvider,
        fake: FakeSummarizationProvider,
      ) => {
        return config.get('NODE_ENV') !== 'test' && config.get('GEMINI_API_KEY')
          ? gemini
          : fake;
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER],
})
export class LlmModule {}
