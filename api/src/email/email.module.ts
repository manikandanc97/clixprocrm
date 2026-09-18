import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { EmailAccountsController } from './controllers/email-accounts.controller';
import { ConnectionVerifierService } from './services/connection-verifier.service';
import { EmailAccountsService } from './services/email-accounts.service';
import { EmailAttachmentStorageService } from './services/email-attachment-storage.service';
import { EmailHtmlSanitizerService } from './services/email-html-sanitizer.service';
import { ImapClientFactory } from './services/imap-client.factory';
import { InboundEmailService } from './services/inbound-email.service';
import { MimeParserService } from './services/mime-parser.service';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [EmailAccountsController],
  providers: [
    EmailAccountsService,
    ConnectionVerifierService,
    MimeParserService,
    EmailHtmlSanitizerService,
    EmailAttachmentStorageService,
    ImapClientFactory,
    InboundEmailService,
  ],
  exports: [
    EmailAccountsService,
    ConnectionVerifierService,
    InboundEmailService,
    EmailAttachmentStorageService,
    MimeParserService,
    EmailHtmlSanitizerService,
    ImapClientFactory,
  ],
})
export class EmailModule {}
